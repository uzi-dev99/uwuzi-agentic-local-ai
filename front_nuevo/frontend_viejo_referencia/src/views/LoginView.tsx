
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';

interface LoginViewProps {
  onLogin: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleLogin = () => {
    // En una app real, aquí se validaría con un backend.
    // Para este caso, solo guardamos el estado y continuamos.
    localStorage.setItem('wuzi-assist-logged-in', 'true');
    onLogin();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-fade-in">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Bot className="mx-auto h-12 w-12 text-accent" />
          <h1 className="text-3xl font-bold text-foreground">Wuzi-Assist</h1>
          <p className="text-muted-foreground">Ingresa para continuar</p>
        </div>
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Nombre de Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-input border-border"
          />
          <Input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-input border-border"
          />
          <Button onClick={handleLogin} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
            Ingresar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
