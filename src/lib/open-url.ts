import { platform } from 'os';
import { spawn } from 'child_process';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function formatBroadcastGameUrl(
  tournamentName: string,
  roundSlug: string,
  gameId: string
): string {
  const tournamentSlug = slugify(tournamentName);
  return `https://lichess.org/broadcast/${tournamentSlug}/${roundSlug}/${gameId}`;
}

export async function openUrl(url: string): Promise<void> {
  const osPlatform = platform();
  let command: string;
  let args: string[];

  if (osPlatform === 'darwin') {
    command = 'open';
    args = [url];
  } else if (osPlatform === 'linux') {
    command = 'xdg-open';
    args = [url];
  } else if (osPlatform === 'win32') {
    command = 'cmd';
    args = ['/c', 'start', '', url];
  } else {
    throw new Error(`Unsupported platform: ${osPlatform}`);
  }

  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      detached: true,
      stdio: 'ignore',
    });

    child.on('error', (error: Error) => {
      console.error(`Failed to open URL: ${error.message}`);
      reject(error);
    });

    child.unref();
    resolve();
  });
}
