
import * as React from 'react';
import DashboardCard from './DashboardCard';
import { ListTodo, Plus, Trash2 } from 'lucide-react';
import { useTodo } from '@/hooks/useTodo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const TodoWidget: React.FC = () => {
    const {
        todos,
        newTodo,
        setNewTodo,
        addTodo,
        toggleTodo,
        deleteTodo,
        isLoading
    } = useTodo();

    return (
        <DashboardCard title="Lista TO-DO" titleIcon={<ListTodo />}>
            {isLoading ? (
                <div className="flex flex-col h-[300px] space-y-4">
                    <div className="flex gap-2 mb-4">
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 w-10" />
                    </div>
                    <div className="space-y-3 pr-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-1">
                                <Skeleton className="h-5 w-5 rounded-sm" />
                                <Skeleton className="h-4 flex-1" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col h-[300px]">
                    <form onSubmit={addTodo} className="flex gap-2 mb-4">
                        <Input
                            placeholder="Añadir nueva tarea..."
                            value={newTodo}
                            onChange={(e) => setNewTodo(e.target.value)}
                        />
                        <Button type="submit" size="icon"><Plus className="h-4 w-4" /></Button>
                    </form>
                    <ScrollArea className="flex-1">
                        <div className="space-y-2 pr-4">
                        {todos.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No hay tareas pendientes.</p>}
                        {todos.map(todo => (
                            <div key={todo.id} className="flex items-center gap-3 group p-1 rounded-md hover:bg-muted/50">
                                <Checkbox id={todo.id} checked={todo.completed} onCheckedChange={() => toggleTodo(todo.id)} />
                                <label htmlFor={todo.id} className={cn("flex-1 text-sm cursor-pointer", todo.completed && "line-through text-muted-foreground")}>
                                    {todo.text}
                                </label>
                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteTodo(todo.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                        </div>
                    </ScrollArea>
                </div>
            )}
        </DashboardCard>
    );
};

export default TodoWidget;
