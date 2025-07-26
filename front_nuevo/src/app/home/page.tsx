'use client';

import Sidebar from "@/components/home/Sidebar";
import HomeContent from "@/components/home/HomeContent";
import HomeHeader from "@/components/home/HomeHeader";
import { useSidebar } from "@/context/SidebarContext";

export default function HomePage() {
  const { isSidebarOpen, toggleSidebar } = useSidebar();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        <HomeHeader />
        <HomeContent />
      </main>
    </div>
  );
}
