
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, Edit2, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  nome: string;
  role: string;
  active: boolean;
  created_at: string;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      console.log('Iniciando atualização de role:', { userId, role });
      
      // Verificar usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Usuário atual:', user?.id);

      const { data, error } = await supabase
        .from('usuarios')
        .update({ role })
        .eq('id', userId)
        .select();

      if (error) {
        console.error('Erro na atualização:', error);
        throw error;
      }

      console.log('Atualização bem-sucedida:', data);

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role } : user
      ));

      toast({
        title: "Sucesso",
        description: "Perfil do usuário atualizado com sucesso",
      });

      setEditingUser(null);
      setNewRole('');

      // Recarregar os dados sem refresh da página para verificar se a mudança persistiu
      await fetchUsers();
      
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: "Erro",
        description: `Não foi possível atualizar o perfil do usuário: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (userId: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ active })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, active } : user
      ));

      toast({
        title: "Sucesso",
        description: `Usuário ${active ? 'ativado' : 'desativado'} com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do usuário",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'coordenacao': return 'default';
      case 'estoque': return 'secondary';
      case 'compras': return 'outline';
      case 'professor': return 'default';
      default: return 'default';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'coordenacao': return 'Coordenação';
      case 'estoque': return 'Estoque';
      case 'compras': return 'Compras';
      case 'professor': return 'Professor';
      default: return role;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <p>Carregando usuários...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Gerenciamento de Usuários
        </CardTitle>
        <CardDescription>
          Gerencie usuários e suas permissões no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="font-medium truncate">{user.nome}</h3>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {getRoleDisplayName(user.role)}
                  </Badge>
                  <Badge variant={user.active ? 'default' : 'secondary'}>
                    {user.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                <p className="text-xs text-muted-foreground">
                  Criado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:shrink-0">
                {editingUser === user.id ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Select value={newRole} onValueChange={setNewRole}>
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Selecionar perfil" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="coordenacao">Coordenação</SelectItem>
                        <SelectItem value="estoque">Estoque</SelectItem>
                        <SelectItem value="compras">Compras</SelectItem>
                        <SelectItem value="professor">Professor</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleRoleChange(user.id, newRole)}
                        disabled={!newRole}
                        className="flex-1 sm:flex-none"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingUser(null);
                          setNewRole('');
                        }}
                        className="flex-1 sm:flex-none"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingUser(user.id);
                        setNewRole(user.role);
                      }}
                      className="flex-1 sm:flex-none"
                    >
                      <Edit2 className="h-4 w-4 sm:mr-0 mr-2" />
                      <span className="sm:hidden">Editar</span>
                    </Button>
                    <Button
                      size="sm"
                      variant={user.active ? "destructive" : "default"}
                      onClick={() => handleToggleActive(user.id, !user.active)}
                      className="flex-1 sm:flex-none"
                    >
                      {user.active ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
