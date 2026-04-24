import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { X, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function UserSelectPage() {
  const navigate = useNavigate();
  const { users, loginAsUser } = useAuth();

  const handleUserSelect = (user: typeof users[0]) => {
    loginAsUser(user);
    navigate('/');
  };

  const handleUseAnother = () => {
    navigate('/login');
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

        {/* Choose user */}
        <h2 className="text-lg font-medium text-foreground mb-4">Choose a user</h2>

        <div className="space-y-2">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => handleUserSelect(user)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary transition-colors duration-150 group"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 text-left text-foreground">{user.name}</span>
              <X className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>

        {/* Use another user */}
        <button
          onClick={handleUseAnother}
          className="w-full flex items-center justify-center gap-2 mt-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <User className="h-4 w-4" />
          <span>Use another user</span>
        </button>

        <div className="border-t border-border my-6" />

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Beautiful Homes Begin Here !!!
        </p>
      </Card>
    </div>
  );
}
