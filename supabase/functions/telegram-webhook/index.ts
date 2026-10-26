import { createServiceClient, jsonResponse } from '../_shared/clients.ts';

interface TelegramUser {
  id: number;
  is_bot?: boolean;
}

interface TelegramChat {
  id: number;
  type?: string;
}

interface TelegramMessage {
  message_id: number;
  text?: string;
  from?: TelegramUser;
  chat?: TelegramChat;
}

interface TelegramCallbackQuery {
  id: string;
  data?: string;
  from: TelegramUser;
  message?: TelegramMessage;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

interface Integration {
  bot_token: string;
  telegram_user_id: string;
  webhook_secret: string;
  is_enabled: boolean;
}

type ConversationStep = 'thread_content' | 'reply_id' | 'reply_content' | 'list_page' | 'delete_id' | 'delete_confirm';

interface Conversation {
  chat_id: string;

  state: ConversationStep;
  target_thread_id: string | null;
  target_short_id: string | null;
  updated_at: string;
}

interface ThreadRow {
  id: string;
  short_id: string;
  content: string;
  created_at: string;
  is_pinned: boolean;
  status: string;
}

interface TelegramResult<T> {
  ok: boolean;
  result?: T;
  description?: string;
}

interface InlineButton {
  text: string;
  callback_data: string;
}

type InlineKeyboard = InlineButton[][];

async function telegramApi<T>(token: string, method: string, payload: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json() as TelegramResult<T>;
  if (!response.ok || !result.ok || result.result === undefined) {
    throw new Error(result.description || `Telegram ${method} failed.`);
  }
  return result.result;
}

async function sendTelegramMessage(token: string, chatId: number, text: string, keyboard?: InlineKeyboard): Promise<void> {
  await telegramApi(token, 'sendMessage', {
    chat_id: chatId,
    text,
    ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
  });
}

async function answerCallback(token: string, callbackId: string, text: string): Promise<void> {
  await telegramApi(token, 'answerCallbackQuery', { callback_query_id: callbackId, text });
}

function exitKeyboard(): InlineKeyboard {
  return [[{ text: 'Keluar', callback_data: 'exit' }]];
}

const helpText = [
  'Pilih perintah, lalu ikuti pertanyaan bot:',
  '',
  '/thread — mulai membuat utas',
  '/reply — pilih ID utas, lalu tulis balasan',
  '/list — pilih halaman daftar utas',
  '/delete — pilih ID utas, lalu konfirmasi penghapusan',
  '/cancel — batalkan langkah yang sedang berjalan',
  '/help — tampilkan panduan ini',
  '',
  'ID utas berupa 6 huruf/angka. Tombol Keluar membatalkan langkah saat ini.',
].join('\n');

const LIST_PAGE_SIZE = 10;
const CONVERSATION_TTL_MS = 24 * 60 * 60 * 1000;

async function readConversation(admin: ReturnType<typeof createServiceClient>, chatId: number): Promise<Conversation | null> {
  const { data, error } = await admin.from('telegram_conversations')
    .select('chat_id, state, target_thread_id, target_short_id, updated_at')
    .eq('chat_id', String(chatId))
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const conversation = data as Conversation;
  if (Date.now() - new Date(conversation.updated_at).getTime() > CONVERSATION_TTL_MS) {
    await admin.from('telegram_conversations').delete().eq('chat_id', String(chatId));
    return null;
  }
  return conversation;
}

async function saveConversation(
  admin: ReturnType<typeof createServiceClient>,
  chatId: number,
  state: ConversationStep,
  targetThreadId: string | null = null,
  targetShortId: string | null = null,
): Promise<void> {
  const { error } = await admin.from('telegram_conversations').upsert({
    chat_id: String(chatId),
    state,
    target_thread_id: targetThreadId,
    target_short_id: targetShortId,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'chat_id' });
  if (error) throw error;
}

async function clearConversation(admin: ReturnType<typeof createServiceClient>, chatId: number): Promise<void> {
  const { error } = await admin.from('telegram_conversations').delete().eq('chat_id', String(chatId));
  if (error) throw error;
}

async function startConversation(
  admin: ReturnType<typeof createServiceClient>,
  token: string,
  chatId: number,
  state: ConversationStep,
  prompt: string,
  commandArgs: string,
): Promise<void> {
  await saveConversation(admin, chatId, state);
  const note = commandArgs
    ? '\nKirim perintah tanpa isi tambahan; bot akan memandu langkah berikutnya.'
    : '';
  await sendTelegramMessage(token, chatId, `${prompt}${note}`, exitKeyboard());
}

async function findRootThreadByShortId(
  admin: ReturnType<typeof createServiceClient>,
  shortId: string,
  publishedOnly: boolean,
): Promise<ThreadRow | null> {
  let query = admin.from('thread_posts')
    .select('id, short_id, content, created_at, is_pinned, status')
    .eq('short_id', shortId)
    .is('parent_id', null);
  if (publishedOnly) query = query.eq('status', 'published');
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data as ThreadRow | null;
}

async function sendThreadList(
  admin: ReturnType<typeof createServiceClient>,
  token: string,
  chatId: number,
  page: number,
): Promise<boolean> {
  const start = (page - 1) * LIST_PAGE_SIZE;
  const { data: threads, count, error } = await admin.from('thread_posts')
    .select('id, short_id, content, created_at, is_pinned, status', { count: 'exact' })
    .is('parent_id', null)
    .order('created_at', { ascending: false })
    .range(start, start + LIST_PAGE_SIZE - 1);
  if (error) {
    await sendTelegramMessage(token, chatId, 'Daftar utas gagal dimuat. Kirim /list untuk mencoba lagi.', exitKeyboard());
    return false;
  }

  const total = count ?? 0;
  if (total === 0) {
    await sendTelegramMessage(token, chatId, 'Belum ada utas yang pernah dibuat.', exitKeyboard());
    return true;
  }

  const pageCount = Math.ceil(total / LIST_PAGE_SIZE);
  if (page > pageCount) {
    await sendTelegramMessage(token, chatId, `Halaman ${page} tidak tersedia. Ada ${pageCount} halaman. Kirim /list untuk memilih halaman.`, exitKeyboard());
    return false;
  }

  const listItems = (threads ?? []).map((thread: ThreadRow, index: number) => {
    const date = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta',
    }).format(new Date(thread.created_at));
    const excerpt = thread.content.replace(/\s+/g, ' ').trim();
    const preview = excerpt.length > 110 ? `${excerpt.slice(0, 110)}…` : excerpt;
    const status = thread.status === 'published' ? 'Terbit' : 'Draf';
    const pinned = thread.is_pinned ? ' · Disematkan' : '';
    return `${start + index + 1}. ${date} · ${status}${pinned} · ID ${thread.short_id}\n${preview}`;
  });
  const firstItem = start + 1;
  const lastItem = Math.min(start + (threads?.length ?? 0), total);
  const message = [`Daftar utas ${firstItem}–${lastItem} dari ${total} · Halaman ${page}/${pageCount}`, '', ...listItems,
    '', 'Balas: /reply · Hapus: /delete'].join('\n\n');
  await sendTelegramMessage(token, chatId, message, exitKeyboard());
  return true;
}

async function publishPost(
  admin: ReturnType<typeof createServiceClient>,
  token: string,
  chatId: number,
  updateId: number,
  content: string,
  parentId: string | null,
  parentShortId: string | null,
): Promise<boolean> {
  if (!content || content.length > 4000) {
    await sendTelegramMessage(token, chatId, 'Teks harus berisi 1–4000 karakter. Silakan kirim ulang.', exitKeyboard());
    return false;
  }

  const { data, error } = await admin.rpc('publish_telegram_thread', {
    p_update_id: updateId,
    p_content: content,
    p_parent_id: parentId,
  });
  if (error) {
    if (error.message.includes('PARENT_THREAD_NOT_FOUND')) {
      await sendTelegramMessage(token, chatId, 'Utas tujuan sudah tidak tersedia. Kirim /reply untuk memilih ID lain.', exitKeyboard());
      return false;
    }
    await sendTelegramMessage(token, chatId, 'Utas gagal diterbitkan. Silakan kirim ulang atau /cancel.', exitKeyboard());
    return false;
  }

  const result = data as { duplicate?: boolean; thread_id?: string; short_id?: string };
  if (result?.duplicate) {
    await clearConversation(admin, chatId);
    await sendTelegramMessage(token, chatId, 'Pesan ini sudah pernah diproses. Tidak ada utas duplikat yang dibuat.');
    return true;
  }

  await clearConversation(admin, chatId);
  const responseText = parentId
    ? `Balasan untuk utas ${parentShortId} berhasil diterbitkan.`
    : `Utas berhasil diterbitkan.\nID: ${result.short_id ?? '—'}`;
  await sendTelegramMessage(token, chatId, responseText);
  return true;
}

async function handleConversationMessage(
  admin: ReturnType<typeof createServiceClient>,
  token: string,
  chatId: number,
  updateId: number,
  text: string,
  conversation: Conversation,
): Promise<void> {
  const value = text.trim();
  if (conversation.state === 'thread_content') {
    if (!value || value.length > 4000) {
      await sendTelegramMessage(token, chatId, 'Isi utas harus berisi 1–4000 karakter. Silakan kirim ulang.', exitKeyboard());
      return;
    }
    await publishPost(admin, token, chatId, updateId, value, null, null);
    return;
  }

  if (conversation.state === 'reply_id') {
    const shortId = value.toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(shortId)) {
      await sendTelegramMessage(token, chatId, 'ID utas harus terdiri dari 6 huruf/angka. Silakan kirim ID dari /list.', exitKeyboard());
      return;
    }
    const thread = await findRootThreadByShortId(admin, shortId, true);
    if (!thread) {
      await sendTelegramMessage(token, chatId, `Utas ${shortId} tidak ditemukan atau belum terbit. Kirim ID lain.`, exitKeyboard());
      return;
    }
    await saveConversation(admin, chatId, 'reply_content', thread.id, thread.short_id);
    await sendTelegramMessage(token, chatId, `Utas ${thread.short_id} dipilih. Silakan kirim isi balasan (1–4000 karakter).`, exitKeyboard());
    return;
  }

  if (conversation.state === 'reply_content') {
    if (!value || value.length > 4000) {
      await sendTelegramMessage(token, chatId, 'Isi balasan harus berisi 1–4000 karakter. Silakan kirim ulang.', exitKeyboard());
      return;
    }
    await publishPost(
      admin, token, chatId, updateId, value,
      conversation.target_thread_id,
      conversation.target_short_id,
    );
    return;
  }

  if (conversation.state === 'list_page') {
    if (!/^\d+$/.test(value)) {
      await sendTelegramMessage(token, chatId, 'Kirim nomor halaman berupa angka positif.', exitKeyboard());
      return;
    }
    const page = Number(value);
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000) {
      await sendTelegramMessage(token, chatId, 'Nomor halaman harus berupa angka positif.', exitKeyboard());
      return;
    }
    const complete = await sendThreadList(admin, token, chatId, page);
    if (complete) await clearConversation(admin, chatId);
    return;
  }

  if (conversation.state === 'delete_id') {
    const shortId = value.toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(shortId)) {
      await sendTelegramMessage(token, chatId, 'ID utas harus terdiri dari 6 huruf/angka. Silakan kirim ID dari /list.', exitKeyboard());
      return;
    }
    const thread = await findRootThreadByShortId(admin, shortId, false);
    if (!thread) {
      await sendTelegramMessage(token, chatId, `Utas ${shortId} tidak ditemukan. Kirim ID lain.`, exitKeyboard());
      return;
    }
    const { count, error } = await admin.from('thread_posts')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', thread.id);
    if (error) throw error;
    await saveConversation(admin, chatId, 'delete_confirm', thread.id, thread.short_id);
    const excerpt = thread.content.replace(/\s+/g, ' ').trim();
    const preview = excerpt.length > 180 ? `${excerpt.slice(0, 180)}…` : excerpt;
    const replyCount = count ?? 0;
    const warning = replyCount > 0 ? `\n${replyCount} balasan juga akan ikut dihapus.` : '';
    await sendTelegramMessage(token, chatId,
      `Hapus utas ${thread.short_id}?\n“${preview}”${warning}\n\nPilih Hapus untuk melanjutkan.`,
      [[
        { text: 'Hapus utas', callback_data: 'delete_confirm' },
        { text: 'Keluar', callback_data: 'exit' },
      ]],
    );
    return;
  }

  await sendTelegramMessage(token, chatId, 'Ketik /thread, /reply, /list, atau /delete untuk memulai.');
}

async function handleCommand(
  admin: ReturnType<typeof createServiceClient>,
  token: string,
  chatId: number,
  text: string,
): Promise<void> {
  const match = /^\/([a-z0-9_]+)(?:@\w+)?(?:\s+([\s\S]*))?$/i.exec(text.trim());
  if (!match) return;
  const command = match[1].toLowerCase();
  const args = match[2]?.trim() ?? '';

  if (command === 'cancel' || command === 'exit') {
    await clearConversation(admin, chatId);
    await sendTelegramMessage(token, chatId, 'Langkah dibatalkan.');
    return;
  }
  if (command === 'start' || command === 'help') {
    await sendTelegramMessage(token, chatId, helpText, exitKeyboard());
    return;
  }

  const prompts: Record<string, { state: ConversationStep; text: string }> = {
    thread: { state: 'thread_content', text: 'Silakan kirim isi utas Anda (1–4000 karakter).' },
    reply: { state: 'reply_id', text: 'Kirim ID utas 6 huruf/angka yang ingin dibalas.' },
    list: { state: 'list_page', text: 'Ketik nomor halaman daftar utas yang ingin dilihat.' },
    delete: { state: 'delete_id', text: 'Kirim ID utas 6 huruf/angka yang ingin dihapus.' },
  };
  const prompt = prompts[command];
  if (prompt) {
    await startConversation(admin, token, chatId, prompt.state, prompt.text, args);
    return;
  }

  await sendTelegramMessage(token, chatId, helpText, exitKeyboard());
}

async function handleCallback(
  admin: ReturnType<typeof createServiceClient>,
  token: string,
  callback: TelegramCallbackQuery,
  chatId: number,
): Promise<void> {
  const conversation = await readConversation(admin, chatId);
  if (callback.data === 'exit') {
    await clearConversation(admin, chatId);
    await answerCallback(token, callback.id, 'Langkah ditutup.');
    await sendTelegramMessage(token, chatId, 'Langkah dibatalkan.');
    return;
  }

  if (callback.data === 'delete_confirm' && conversation?.state === 'delete_confirm' && conversation.target_thread_id) {
    const { data, error } = await admin.from('thread_posts')
      .delete()
      .eq('id', conversation.target_thread_id)
      .is('parent_id', null)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    await clearConversation(admin, chatId);
    await answerCallback(token, callback.id, data ? 'Utas dihapus.' : 'Utas sudah tidak tersedia.');
    await sendTelegramMessage(token, chatId,
      data
        ? `Utas ${conversation.target_short_id ?? ''} dan seluruh balasannya berhasil dihapus.`
        : 'Utas sudah tidak tersedia atau telah dihapus.',
    );
    return;
  }

  await answerCallback(token, callback.id, 'Langkah sudah berakhir.');
}

Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') return jsonResponse({ error: 'Metode tidak didukung.' }, 405);

  try {
    const admin = createServiceClient();
    const { data: integration, error } = await admin.from('telegram_integrations')
      .select('bot_token, telegram_user_id, webhook_secret, is_enabled')
      .eq('id', true)
      .maybeSingle();
    if (error) throw error;

    const config = integration as Integration | null;
    if (!config?.is_enabled) return jsonResponse({ error: 'Bot tidak terhubung.' }, 404);
    if (request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== config.webhook_secret) {
      return jsonResponse({ error: 'Webhook secret tidak valid.' }, 401);
    }

    const update = await request.json() as TelegramUpdate;
    if (update.callback_query) {
      const callback = update.callback_query;
      const chat = callback.message?.chat;
      const isAllowedUser = String(callback.from.id) === config.telegram_user_id
        && String(chat?.id) === config.telegram_user_id
        && chat?.type === 'private'
        && !callback.from.is_bot;
      if (!isAllowedUser || !chat) return jsonResponse({ ok: true });
      await handleCallback(admin, config.bot_token, callback, chat.id);
      return jsonResponse({ ok: true });
    }

    const message = update.message;
    if (!message?.text || !message.from || !message.chat) return jsonResponse({ ok: true });
    const isAllowedUser = String(message.from.id) === config.telegram_user_id
      && String(message.chat.id) === config.telegram_user_id
      && message.chat.type === 'private'
      && !message.from.is_bot;
    if (!isAllowedUser) return jsonResponse({ ok: true });

    const text = message.text.trim();
    const chatId = message.chat.id;
    if (text.startsWith('/')) {
      await handleCommand(admin, config.bot_token, chatId, text);
      return jsonResponse({ ok: true });
    }

    const conversation = await readConversation(admin, chatId);
    if (!conversation) {
      await sendTelegramMessage(config.bot_token, chatId, 'Mulai dengan /thread, /reply, /list, atau /delete. Kirim /help untuk panduan.');
      return jsonResponse({ ok: true });
    }
    await handleConversationMessage(admin, config.bot_token, chatId, update.update_id, text, conversation);
    return jsonResponse({ ok: true });
  } catch (error) {
    console.error('Telegram webhook processing failed:', error instanceof Error ? error.message : 'unknown error');
    return jsonResponse({ error: 'Webhook gagal diproses.' }, 500);
  }
});





