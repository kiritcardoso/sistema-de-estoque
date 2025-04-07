
import React from 'react';
import { Button } from '@/components/ui/button';
import { BarChart, Package, TrendingUp, FileText, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const isMobile = useIsMobile();
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart },
    { id: 'items', label: 'Gerenciar Itens', icon: Package },
    { id: 'movements', label: 'Movimentações', icon: TrendingUp },
    { id: 'reports', label: 'Relatórios', icon: FileText },
  ];

  const MenuItems = ({ onItemClick }: { onItemClick?: () => void }) => (
    <>
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <Button
            key={item.id}
            variant={currentPage === item.id ? 'default' : 'ghost'}
            onClick={() => {
              onPageChange(item.id);
              onItemClick?.();
            }}
            className="flex items-center space-x-2 w-full justify-start"
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Button>
        );
      })}
    </>
  );

  if (isMobile) {
    return (
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="h-6 w-6" />
              <span className="font-bold text-lg">Sistema de Estoque</span>
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col space-y-2 mt-6">
                  <MenuItems onItemClick={() => {}} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center space-x-1">
          <div className="flex items-center space-x-2 mr-6">
            <Package className="h-6 w-6" />
            <span className="font-bold text-xl">Sistema de Estoque</span>
          </div>
          
          <div className="flex space-x-1">
            <MenuItems />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
