import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { SidebarProvider } from '@/components/ui/sidebar';
import HomeSidebar from '@/components/HomeSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import CalendarWidget from '@/components/dashboard/CalendarWidget';
import ExpenseChartWidget from '@/components/dashboard/ExpenseChartWidget';
import TodoWidget from '@/components/dashboard/TodoWidget';
import DayDetailPanel from '@/components/dashboard/DayDetailPanel';
import { Drawer, DrawerContent } from "@/components/ui/drawer";

interface DashboardViewProps {
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ selectedFolderId, setSelectedFolderId }) => {
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();
    const userId = currentUser!.id;

    const { data: folders = [], isLoading: isLoadingFolders } = useQuery({
      queryKey: ['folders', userId],
      queryFn: () => api.fetchFolders(userId),
      enabled: !!userId,
    });

    const createFolderMutation = useMutation({
        mutationFn: (folderName: string) => api.createFolder({ name: folderName, userId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folders', userId] });
        }
    });

    const deleteFolderMutation = useMutation({
        mutationFn: (folderId: string) => api.deleteFolder({ folderId, userId }),
        onSuccess: (_data, folderId) => {
            queryClient.invalidateQueries({ queryKey: ['folders', userId] });
            queryClient.invalidateQueries({ queryKey: ['chats', userId] });
            if (selectedFolderId === folderId) {
              setSelectedFolderId(null);
            }
        }
    });

    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>();

    const handleDateSelect = (date: Date | undefined) => {
        if (selectedDate && date && selectedDate.getTime() === date.getTime()) {
            setSelectedDate(undefined);
        } else {
            setSelectedDate(date);
        }
    };
    
    const handlePanelClose = () => {
        setSelectedDate(undefined);
    }

    const handleNewFolder = () => {
        const folderName = prompt("Introduce el nombre de la nueva carpeta:");
        if (folderName) {
          createFolderMutation.mutate(folderName);
        }
    };

    const handleDeleteFolder = (folderId: string) => {
        if (window.confirm("¿Estás seguro de que quieres eliminar esta carpeta? Los chats que contiene no se borrarán y se moverán a la vista 'Todas'.")) {
          deleteFolderMutation.mutate(folderId);
        }
    };

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <HomeSidebar
                    className="hidden lg:flex"
                    folders={folders}
                    selectedFolderId={selectedFolderId}
                    onSelectFolder={setSelectedFolderId}
                    onNewFolder={handleNewFolder}
                    onDeleteFolder={handleDeleteFolder}
                    isLoading={isLoadingFolders}
                />
                <main className="flex-1 bg-muted/20">
                    <div className="flex flex-col h-screen">
                        <DashboardHeader />
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar animate-fade-in">
                            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 max-w-7xl mx-auto">
                                <div className={selectedDate ? "lg:col-span-2" : "lg:col-span-3"}>
                                    <div className="grid gap-6">
                                        <CalendarWidget 
                                            onDateSelect={handleDateSelect}
                                            selectedDate={selectedDate}
                                        />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <ExpenseChartWidget />
                                            <TodoWidget />
                                        </div>
                                    </div>
                                </div>
                                {selectedDate && (
                                    <div className="hidden lg:block lg:col-span-1 animate-fade-in">
                                        <DayDetailPanel 
                                            key={selectedDate.toString() + '-desktop'}
                                            date={selectedDate} 
                                            onClose={handlePanelClose}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="lg:hidden">
                        {selectedDate && (
                            <Drawer open={!!selectedDate} onOpenChange={(open) => !open && handlePanelClose()}>
                                <DrawerContent>
                                    <div className="p-4 pt-0 h-[80vh]">
                                        <DayDetailPanel
                                            key={selectedDate.toString() + '-mobile'}
                                            date={selectedDate}
                                            onClose={handlePanelClose}
                                        />
                                    </div>
                                </DrawerContent>
                            </Drawer>
                        )}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
};

export default DashboardView;
