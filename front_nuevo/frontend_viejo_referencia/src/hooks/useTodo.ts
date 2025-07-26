
import * as React from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { TodoItem } from '@/types/todo';

const initialTodos: TodoItem[] = [
    { id: '1', text: 'Implementar dashboard', completed: true },
    { id: '2', text: 'Añadir widget de calendario', completed: true },
    { id: '3', text: 'Crear widget de TODOs', completed: false },
];

export const useTodo = () => {
    const [todos, setTodos] = useLocalStorage<TodoItem[]>('todo-widget-items', initialTodos);
    const [newTodo, setNewTodo] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800); // Simulamos 0.8 segundos de carga

        return () => clearTimeout(timer);
    }, []);

    const addTodo = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTodo.trim()) {
            setTodos(prevTodos => [...prevTodos, { id: Date.now().toString(), text: newTodo, completed: false }]);
            setNewTodo('');
        }
    };

    const toggleTodo = (id: string) => {
        setTodos(prevTodos => prevTodos.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo));
    };

    const deleteTodo = (id: string) => {
        setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
    };

    return {
        todos,
        newTodo,
        setNewTodo,
        addTodo,
        toggleTodo,
        deleteTodo,
        isLoading,
    };
}
