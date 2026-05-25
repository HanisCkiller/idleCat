interface Window {
  electronAPI?: {
    setIgnoreMouseEvents: (ignore: boolean) => void;
    onSetPetVisible: (cb: (visible: boolean) => void) => void;
    onTogglePetVisible: (cb: () => void) => void;
    onUserActivity: (cb: (active: boolean) => void) => void;
  };
}
