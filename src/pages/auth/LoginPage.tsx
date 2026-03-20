import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast({
          title: 'Welcome back!',
          description: 'You have successfully logged in.',
        });
        navigate('/');
      } else {
        toast({
          title: 'Login failed',
          description: 'Invalid email or password.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-lavender flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 animate-scale-in">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full border-4 border-info flex items-center justify-center bg-card">
            <span className="text-2xl font-bold text-primary">ERP</span>
          </div>
        </div>

        <div className="border-t border-border my-6" />

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="email">Email</Label>
              <Link
                to="/select-user"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Choose a user
              </Link>
            </div>
            <Input
              id="email"
              type="email"
              placeholder=""
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="transition-all duration-150 focus:ring-2"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Reset Password
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder=""
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10 transition-all duration-150 focus:ring-2"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              'Log in'
            )}
          </Button>
        </form>

        <div className="border-t border-border my-6" />

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Self-Hosted ERP System
        </p>
      </Card>
    </div>
  );
}
