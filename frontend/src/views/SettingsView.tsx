
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User as UserIcon, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ProcessMonitorDialog from '@/components/settings/ProcessMonitorDialog';

const SettingsView: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser, updateUser, appLogo, setAppLogo, theme, setTheme } = useAuth();
  
  const [apiUrl, setApiUrl] = React.useState(() => localStorage.getItem('wuzi-assist-api-url') || '');
  const [apiKey, setApiKey] = React.useState(() => localStorage.getItem('wuzi-assist-api-key') || '');
  const [model, setModel] = React.useState(() => localStorage.getItem('wuzi-assist-ollama-model') || 'gemma3:12b');
  const [temperature, setTemperature] = React.useState(() => localStorage.getItem('wuzi-assist-ollama-temp') || '0.7');
  
  const [username, setUsername] = React.useState(currentUser?.username || '');
  const [avatar, setAvatar] = React.useState(currentUser?.avatar || '');
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [isMonitorOpen, setIsMonitorOpen] = React.useState(false);

  React.useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username);
      setAvatar(currentUser.avatar || '');
    }
  }, [currentUser]);

  const handleSave = () => {
    // Save API settings
    localStorage.setItem('wuzi-assist-api-url', apiUrl);
    localStorage.setItem('wuzi-assist-api-key', apiKey);

    // Add these lines
    localStorage.setItem('wuzi-assist-ollama-model', model);
    localStorage.setItem('wuzi-assist-ollama-temp', temperature);

    // Save Profile settings
    if (currentUser) {
      updateUser({ ...currentUser, username, avatar });
    }

    toast({
      title: "Guardado",
      description: "Tu configuración ha sido guardada.",
    });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSaveLogo = () => {
    if (logoPreview) {
      setAppLogo(logoPreview);
      setLogoPreview(null);
      toast({
        title: "Logo actualizado",
        description: "El logo de la aplicación ha sido actualizado.",
      });
    } else {
      toast({
        title: "Error",
        description: "Primero debes subir un nuevo logo.",
        variant: "destructive",
      });
    }
  };

  const handleRevertLogo = () => {
    setAppLogo(null);
    setLogoPreview(null);
    toast({
      title: "Logo restaurado",
      description: "El logo ha sido restaurado al valor por defecto.",
    });
  };

  return (
    <div className="min-h-screen p-4 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/?view=home')} className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Configuración</h1>
        </div>
        
        <div className="bg-secondary/50 backdrop-blur-sm rounded-xl p-6 border border-border/50 space-y-8">
          
          {/* User Profile Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Perfil de Usuario</h2>
            <div className="flex items-center space-x-4 pt-2">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatar} alt={username} />
                <AvatarFallback>
                  <UserIcon className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="avatar-upload" className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm">
                  Cambiar Avatar
                </Label>
                <Input id="avatar-upload" type="file" className="hidden" onChange={handleAvatarUpload} accept="image/*" />
              </div>
            </div>
            <div>
              <Label htmlFor="username" className="text-base font-medium">Nombre de Usuario</Label>
              <Input 
                id="username"
                placeholder="Tu nombre de usuario" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          
          {/* App Logo Section */}
          {currentUser?.role === 'admin' && (
            <div className="space-y-4 border-t border-border/50 pt-8">
              <h2 className="text-xl font-semibold">Logo de la Aplicación</h2>
              <div className="flex items-center space-x-4 pt-2">
                <p className="text-sm text-muted-foreground">Logo actual:</p>
                <div className="flex items-center justify-center h-12 w-auto p-1 bg-background/20 rounded-md">
                  {appLogo ? (
                    <img src={appLogo} alt="App Logo" className="h-10 w-auto" />
                  ) : (
                    <span className="font-bold text-lg px-2">Wuzi</span>
                  )}
                </div>
              </div>

              {logoPreview && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Previsualización nuevo logo:</p>
                  <div className="flex items-center justify-center h-12 w-auto p-1 bg-background/20 rounded-md border border-dashed">
                      <img src={logoPreview} alt="New Logo Preview" className="h-10 w-auto" />
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Como administrador, puedes subir un logo personalizado para la aplicación.
              </p>
              <div className="flex flex-wrap gap-2 items-center">
                <div>
                  <Label htmlFor="logo-upload" className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm">
                    Subir Logo
                  </Label>
                  <Input id="logo-upload" type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                </div>
                <Button onClick={handleSaveLogo} disabled={!logoPreview}>Guardar Logo</Button>
                <Button variant="outline" onClick={handleRevertLogo}>Restaurar por defecto</Button>
              </div>
            </div>
          )}

          {/* Theme Settings Section */}
          <div className="space-y-4 border-t border-border/50 pt-8">
            <h2 className="text-xl font-semibold">Apariencia</h2>
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
              <div>
                <Label htmlFor="theme-switch" className="text-base font-medium">Modo Oscuro</Label>
                <p className="text-sm text-muted-foreground">
                  Activa o desactiva el modo oscuro para la aplicación.
                </p>
              </div>
              <Switch
                id="theme-switch"
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>
          </div>

          {/* Process Monitor Section */}
          <div className="space-y-4 border-t border-border/50 pt-8">
            <h2 className="text-xl font-semibold">Monitorización</h2>
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
              <div>
                <Label className="text-base font-medium">Monitor de Procesos</Label>
                <p className="text-sm text-muted-foreground">
                  Ver el estado de los procesos de agente activos.
                </p>
              </div>
              <Button onClick={() => setIsMonitorOpen(true)}>
                <Activity className="mr-2 h-4 w-4" />
                Abrir
              </Button>
              <ProcessMonitorDialog open={isMonitorOpen} onOpenChange={setIsMonitorOpen} />
            </div>
          </div>

          {/* API Settings Section */}
          <div className="space-y-4 border-t border-border/50 pt-8">
            <h2 className="text-xl font-semibold">Configuración de API</h2>
            <div>
              <Label htmlFor="api-url" className="text-base font-medium">URL del Endpoint</Label>
              <Input 
                id="api-url" 
                placeholder="https://tu-api.com/v1" 
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="api-key" className="text-base font-medium">API Key</Label>
              <Input 
                id="api-key" 
                type="password"
                placeholder="••••••••••••••••••••" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="mt-2"
              />
            </div>

            {/* MOVED Ollama Model Input */}
            <div>
              <Label htmlFor="ollama-model" className="text-base font-medium">Modelo de Ollama</Label>
              <Input
                id="ollama-model"
                placeholder="Ej: llama3, mistral"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="mt-2"
              />
            </div>

            {/* MOVED Temperature Input */}
            <div>
              <Label htmlFor="ollama-temperature" className="text-base font-medium">Temperatura</Label>
              <Input
                id="ollama-temperature"
                type="number"
                placeholder="Ej: 0.7 (0.0 - 2.0)"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="mt-2"
                step="0.1"
                min="0"
              />
            </div>
          </div>
          
          {/* Actions Section */}
          <div className="pt-4 space-y-3 border-t border-border/50">
            <Button onClick={handleSave} className="w-full">
              Guardar Cambios
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
