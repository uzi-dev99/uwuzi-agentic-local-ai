
import * as React from 'react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarMenuAction } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Folder as FolderIcon, FolderPlus, MessageSquare, Trash2, LayoutDashboard } from 'lucide-react';
import type { Folder } from '@/types/chat';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface HomeSidebarProps {
  folders: Folder[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onNewFolder: () => void;
  onDeleteFolder: (folderId: string) => void;
  isLoading: boolean;
}

const HomeSidebar: React.FC<HomeSidebarProps> = ({ folders, selectedFolderId, onSelectFolder, onNewFolder, onDeleteFolder, isLoading }) => {
  const { appLogo } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view') || 'home';

  const handleFolderSelect = (id: string | null) => {
    onSelectFolder(id);
    if (view !== 'home') {
      navigate('/?view=home');
    }
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="p-4 text-center">
          {appLogo ? (
            <img src={appLogo} alt="App Logo" className="h-10 w-auto mx-auto" />
          ) : (
            <h2 className="text-2xl font-bold">Wuzi</h2>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="custom-scrollbar">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
               <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate('/?view=dashboard')} isActive={view === 'dashboard'}>
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => handleFolderSelect(null)} isActive={view === 'home' && selectedFolderId === null}>
                  <MessageSquare />
                  <span>Todas</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isLoading ? (
                <>
                  {[...Array(3)].map((_, i) => (
                    <SidebarMenuItem key={i}>
                      <div className="flex items-center gap-2 p-2 w-full">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </SidebarMenuItem>
                  ))}
                </>
              ) : (
                folders.map((folder) => (
                  <SidebarMenuItem key={folder.id}>
                    <SidebarMenuButton onClick={() => handleFolderSelect(folder.id)} isActive={view === 'home' && selectedFolderId === folder.id}>
                      <FolderIcon />
                      <span>{folder.name}</span>
                    </SidebarMenuButton>
                    <SidebarMenuAction
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFolder(folder.id);
                      }}
                      showOnHover={true}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button variant="outline" className="w-full" onClick={onNewFolder} disabled={isLoading}>
          <FolderPlus className="mr-2 h-4 w-4" />
          Nueva Carpeta
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default HomeSidebar;
