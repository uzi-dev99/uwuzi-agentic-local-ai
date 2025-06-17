
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface NewChatButtonProps {
    onClick: () => void;
}

const NewChatButton: React.FC<NewChatButtonProps> = ({ onClick }) => {
    return (
        <Button 
          onClick={onClick}
          className="fixed bottom-8 right-8 h-16 w-16 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg"
        >
          <Plus className="h-8 w-8" />
        </Button>
    );
};

export default NewChatButton;
