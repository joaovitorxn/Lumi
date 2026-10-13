export type Locale = 'pt' | 'en' | 'es';

export const LOCALES: { id: Locale; label: string; tag: string }[] = [
  { id: 'pt', label: 'Português', tag: 'pt-BR' },
  { id: 'en', label: 'English', tag: 'en-US' },
  { id: 'es', label: 'Español', tag: 'es-ES' }
];

const pt = {
  'app.noDevices': 'Nenhum dispositivo encontrado.',
  'devices.nav': 'Aparelhos',
  'inactive.unsupported': 'Ainda não suportado',
  'inactive.offline': 'Offline',
  'inactive.noResponse': 'Sem resposta',
  'camera.live': "Ao vivo",
  'camera.connecting': "Conectando…",
  'camera.error': "Não foi possível abrir o vídeo",
  'camera.retry': "Tentar de novo",
  'camera.pad': "Mover a câmera",
  'camera.on': "Ligado",
  'camera.pipOn': "Imagem sobre imagem",
  'camera.pipOff': "Sair da imagem sobre imagem",
  'camera.soundOn': "Ativar o som",
  'camera.soundOff': "Silenciar",
  'camera.privacyOn': "Privacidade ativada",
  'camera.off': "Desligado",
  'camera.up': "Para cima",
  'camera.right': "Para a direita",
  'camera.down': "Para baixo",
  'camera.left': "Para a esquerda",
  'camera.private': "Privacidade",
  'camera.tracking': "Seguir movimento",
  'power.on': 'Ligar {name}',
  'power.off': 'Desligar {name}',
  'light.brightness': 'Brilho',
  'light.off': 'Desligada',
  'light.tapToTurnOn': 'Toque no botão para ligar',
  'light.white': 'Branco',
  'light.whiteNamed': 'Branco {warmth}',
  'light.colour': 'Cor',
  'light.tapToChoose': 'Toque para escolher',
  'light.dimmer': 'Diminuir brilho',
  'light.brighter': 'Aumentar brilho',
  'light.temperature': 'Temperatura',
  'light.hue': 'Matiz',
  'light.saturation': 'Saturação',
  'warmth.warm': 'Quente',
  'warmth.neutral': 'Neutro',
  'warmth.cool': 'Frio',
  'hue.red': 'Vermelho',
  'hue.orange': 'Laranja',
  'hue.yellow': 'Amarelo',
  'hue.green': 'Verde',
  'hue.cyan': 'Ciano',
  'hue.blue': 'Azul',
  'hue.violet': 'Violeta',
  'hue.pink': 'Rosa',
  'sync.updating': 'Atualizando…',
  'sync.waiting': 'Aguardando…',
  'sync.syncedAt': 'Sincronizado às {time}',
  'sync.retry': 'Tentar de novo',
  'sync.refresh': 'Atualizar',
  'sync.settings': 'Configurações',
  'settings.title': 'Configurações',
  'settings.back': 'Voltar',
  'settings.credentials': 'Credenciais Tuya',
  'settings.credentialsHint': 'Access ID, Access Secret e região',
  'settings.language': 'Idioma',
  'settings.startup': 'Iniciar com o Windows',
  'settings.startupHint': 'Abre o Lumi na bandeja ao ligar o PC',
  'cred.title': 'Credenciais Tuya',
  'cred.hint':
    'Copie do projeto em iot.tuya.com (aba Overview). Ficam guardadas no Gerenciador de Credenciais do Windows.',
  'cred.accessId': 'Access ID',
  'cred.accessSecret': 'Access Secret',
  'cred.region': 'Região',
  'cred.fill': 'Preencha o Access ID e o Access Secret.',
  'cred.save': 'Salvar',
  'cred.saving': 'Salvando…',
  'cred.cancel': 'Cancelar',
  'tray.settings': 'Configurações',
  'tray.quit': 'Sair'
};

export type Key = keyof typeof pt;

const en: Record<Key, string> = {
  'app.noDevices': 'No devices found.',
  'devices.nav': 'Devices',
  'inactive.unsupported': 'Not supported yet',
  'inactive.offline': 'Offline',
  'inactive.noResponse': 'No response',
  'camera.live': "Live",
  'camera.connecting': "Connecting…",
  'camera.error': "Couldn't open the video",
  'camera.retry': "Try again",
  'camera.pad': "Move camera",
  'camera.on': "On",
  'camera.pipOn': "Picture in picture",
  'camera.pipOff': "Exit picture in picture",
  'camera.soundOn': "Turn sound on",
  'camera.soundOff': "Mute",
  'camera.privacyOn': "Privacy mode on",
  'camera.off': "Off",
  'camera.up': "Up",
  'camera.right': "Right",
  'camera.down': "Down",
  'camera.left': "Left",
  'camera.private': "Privacy",
  'camera.tracking': "Track motion",
  'power.on': 'Turn on {name}',
  'power.off': 'Turn off {name}',
  'light.brightness': 'Brightness',
  'light.off': 'Off',
  'light.tapToTurnOn': 'Press the button to turn on',
  'light.white': 'White',
  'light.whiteNamed': '{warmth} white',
  'light.colour': 'Colour',
  'light.tapToChoose': 'Tap to choose',
  'light.dimmer': 'Decrease brightness',
  'light.brighter': 'Increase brightness',
  'light.temperature': 'Temperature',
  'light.hue': 'Hue',
  'light.saturation': 'Saturation',
  'warmth.warm': 'Warm',
  'warmth.neutral': 'Neutral',
  'warmth.cool': 'Cool',
  'hue.red': 'Red',
  'hue.orange': 'Orange',
  'hue.yellow': 'Yellow',
  'hue.green': 'Green',
  'hue.cyan': 'Cyan',
  'hue.blue': 'Blue',
  'hue.violet': 'Violet',
  'hue.pink': 'Pink',
  'sync.updating': 'Updating…',
  'sync.waiting': 'Waiting…',
  'sync.syncedAt': 'Synced at {time}',
  'sync.retry': 'Try again',
  'sync.refresh': 'Refresh',
  'sync.settings': 'Settings',
  'settings.title': 'Settings',
  'settings.back': 'Back',
  'settings.credentials': 'Tuya credentials',
  'settings.credentialsHint': 'Access ID, Access Secret and region',
  'settings.language': 'Language',
  'settings.startup': 'Start with Windows',
  'settings.startupHint': 'Opens Lumi in the tray when the PC starts',
  'cred.title': 'Tuya credentials',
  'cred.hint': 'Copy them from your project at iot.tuya.com (Overview tab). They are kept in Windows Credential Manager.',
  'cred.accessId': 'Access ID',
  'cred.accessSecret': 'Access Secret',
  'cred.region': 'Region',
  'cred.fill': 'Fill in the Access ID and the Access Secret.',
  'cred.save': 'Save',
  'cred.saving': 'Saving…',
  'cred.cancel': 'Cancel',
  'tray.settings': 'Settings',
  'tray.quit': 'Quit'
};

const es: Record<Key, string> = {
  'app.noDevices': 'No se encontró ningún dispositivo.',
  'devices.nav': 'Dispositivos',
  'inactive.unsupported': 'Aún no compatible',
  'inactive.offline': 'Sin conexión',
  'inactive.noResponse': 'Sin respuesta',
  'camera.live': "En vivo",
  'camera.connecting': "Conectando…",
  'camera.error': "No se pudo abrir el video",
  'camera.retry': "Reintentar",
  'camera.pad': "Mover la cámara",
  'camera.on': "Activado",
  'camera.pipOn': "Imagen en imagen",
  'camera.pipOff': "Salir de imagen en imagen",
  'camera.soundOn': "Activar el sonido",
  'camera.soundOff': "Silenciar",
  'camera.privacyOn': "Privacidad activada",
  'camera.off': "Desactivado",
  'camera.up': "Arriba",
  'camera.right': "Derecha",
  'camera.down': "Abajo",
  'camera.left': "Izquierda",
  'camera.private': "Privacidad",
  'camera.tracking': "Seguir movimiento",
  'power.on': 'Encender {name}',
  'power.off': 'Apagar {name}',
  'light.brightness': 'Brillo',
  'light.off': 'Apagada',
  'light.tapToTurnOn': 'Pulsa el botón para encender',
  'light.white': 'Blanco',
  'light.whiteNamed': 'Blanco {warmth}',
  'light.colour': 'Color',
  'light.tapToChoose': 'Toca para elegir',
  'light.dimmer': 'Reducir brillo',
  'light.brighter': 'Aumentar brillo',
  'light.temperature': 'Temperatura',
  'light.hue': 'Matiz',
  'light.saturation': 'Saturación',
  'warmth.warm': 'Cálido',
  'warmth.neutral': 'Neutro',
  'warmth.cool': 'Frío',
  'hue.red': 'Rojo',
  'hue.orange': 'Naranja',
  'hue.yellow': 'Amarillo',
  'hue.green': 'Verde',
  'hue.cyan': 'Cian',
  'hue.blue': 'Azul',
  'hue.violet': 'Violeta',
  'hue.pink': 'Rosa',
  'sync.updating': 'Actualizando…',
  'sync.waiting': 'Esperando…',
  'sync.syncedAt': 'Sincronizado a las {time}',
  'sync.retry': 'Reintentar',
  'sync.refresh': 'Actualizar',
  'sync.settings': 'Ajustes',
  'settings.title': 'Ajustes',
  'settings.back': 'Volver',
  'settings.credentials': 'Credenciales de Tuya',
  'settings.credentialsHint': 'Access ID, Access Secret y región',
  'settings.language': 'Idioma',
  'settings.startup': 'Iniciar con Windows',
  'settings.startupHint': 'Abre Lumi en la bandeja al encender el PC',
  'cred.title': 'Credenciales de Tuya',
  'cred.hint':
    'Cópialas del proyecto en iot.tuya.com (pestaña Overview). Se guardan en el Administrador de credenciales de Windows.',
  'cred.accessId': 'Access ID',
  'cred.accessSecret': 'Access Secret',
  'cred.region': 'Región',
  'cred.fill': 'Rellena el Access ID y el Access Secret.',
  'cred.save': 'Guardar',
  'cred.saving': 'Guardando…',
  'cred.cancel': 'Cancelar',
  'tray.settings': 'Ajustes',
  'tray.quit': 'Salir'
};

const dictionaries: Record<Locale, Record<Key, string>> = { pt, en, es };
const STORAGE_KEY = 'lumi.locale';

function detect(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'pt' || saved === 'en' || saved === 'es') return saved;
  } catch {
    // storage unavailable: fall through to the system language
  }
  const system = (typeof navigator === 'undefined' ? '' : navigator.language).slice(0, 2);
  return system === 'en' || system === 'es' ? system : 'pt';
}

let current = $state<Locale>(detect());

export const locale = {
  get current() {
    return current;
  },
  /** BCP 47 tag for Intl formatting (times, numbers). */
  get tag() {
    return LOCALES.find((l) => l.id === current)!.tag;
  },
  set(next: Locale) {
    current = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // not persisted; still applies for this session
    }
  }
};

/** Translates `key` into the active language, filling `{name}`-style placeholders. */
export function t(key: Key, params?: Record<string, string | number>): string {
  const text = dictionaries[current][key];
  return params ? text.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? '')) : text;
}
