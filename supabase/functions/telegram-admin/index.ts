import { authenticateAdmin, createServiceClient, getProjectUrl, jsonResponse } from '../_shared/clients.ts';

interface TelegramResult<T> {
  ok: boolean;
  result?: T;
  description?: string;
}

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

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  } });

  if (!await authenticateAdmin(request)) return jsonResponse({ error: 'Sesi admin tidak valid.' }, 401);

  try {
    const admin = createServiceClient();
    if (request.method === 'GET') {
      const { data, error } = await admin
        .from('telegram_integrations')
        .select('bot_username, telegram_user_id, is_enabled')
        .eq('id', true)
        .maybeSingle();
      if (error) throw error;
      return jsonResponse({
        configured: Boolean(data),
        enabled: Boolean(data?.is_enabled),
        botUsername: data?.bot_username ?? null,
        telegramUserId: data?.telegram_user_id ?? null,
      });
    }

    if (request.method === 'POST') {
      const body = await request.json() as { botToken?: string; telegramUserId?: string };
      const { data: savedConfig, error: readError } = await admin.from('telegram_integrations')
        .select('bot_token, telegram_user_id')
        .eq('id', true)
        .maybeSingle();
      if (readError) throw readError;

      const botToken = body.botToken?.trim() || savedConfig?.bot_token || '';
      const telegramUserId = body.telegramUserId?.trim() || savedConfig?.telegram_user_id || '';
      if (!botToken || !/^[0-9]{1,20}$/.test(telegramUserId)) {
        return jsonResponse({ error: 'Isi token bot dan user ID Telegram numerik.' }, 400);
      }

      const bot = await telegramApi<{ username?: string; is_bot: boolean }>(botToken, 'getMe');
      if (!bot.is_bot) return jsonResponse({ error: 'Token tersebut bukan token bot Telegram.' }, 400);

      const webhookSecret = crypto.randomUUID().replaceAll('-', '');
      const { error: saveError } = await admin.from('telegram_integrations').upsert({
        id: true,
        bot_token: botToken,
        telegram_user_id: telegramUserId,
        bot_username: bot.username ?? null,
        webhook_secret: webhookSecret,
        is_enabled: false,
        updated_at: new Date().toISOString(),
      });
      if (saveError) throw saveError;

      try {
        await telegramApi<boolean>(botToken, 'setWebhook', {
          url: `${getProjectUrl()}/functions/v1/telegram-webhook`,
          secret_token: webhookSecret,
          allowed_updates: ['message', 'callback_query'],
        });
        await telegramApi<boolean>(botToken, 'setMyCommands', {
          commands: [
            { command: 'thread', description: 'Mulai membuat utas' },
            { command: 'reply', description: 'Mulai membalas utas' },
            { command: 'list', description: 'Lihat daftar utas per halaman' },
            { command: 'delete', description: 'Mulai menghapus utas' },
            { command: 'help', description: 'Lihat panduan bot' },
            { command: 'cancel', description: 'Batalkan langkah saat ini' },
          ],
        });
      } catch (error) {
        await admin.from('telegram_integrations').update({ is_enabled: false }).eq('id', true);
        throw error;
      }

      const { error: enableError } = await admin.from('telegram_integrations')
        .update({ is_enabled: true, updated_at: new Date().toISOString() })
        .eq('id', true);
      if (enableError) throw enableError;

      return jsonResponse({
        configured: true,
        enabled: true,
        botUsername: bot.username ?? null,
        telegramUserId,
      });
    }

    if (request.method === 'DELETE') {
      const { data, error } = await admin.from('telegram_integrations')
        .select('bot_token')
        .eq('id', true)
        .maybeSingle();
      if (error) throw error;
      if (data?.bot_token) await telegramApi<boolean>(data.bot_token, 'deleteWebhook');
      const { error: deleteError } = await admin.from('telegram_integrations').delete().eq('id', true);
      if (deleteError) throw deleteError;
      return jsonResponse({ configured: false, enabled: false, botUsername: null, telegramUserId: null });
    }

    return jsonResponse({ error: 'Metode tidak didukung.' }, 405);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Pengaturan Telegram gagal diproses.';
    return jsonResponse({ error: message }, 502);
  }
});



