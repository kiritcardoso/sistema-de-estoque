import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  nome: string;
  role: string;
  active: boolean;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: authData } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          // Delay para evitar race condition
          setTimeout(async () => {
            try {
              const { data: profileData, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (error) {
                console.error('Erro ao buscar perfil:', error);
                // Se não encontrar o perfil, tenta criar um
                if (error.code === 'PGRST116') {
                  console.log('Perfil não encontrado, criando...');
                  try {
                    const { data: newProfile, error: createError } = await supabase
                      .from('usuarios')
                      .insert({
                        id: session.user.id,
                        email: session.user.email!,
                        nome: session.user.user_metadata?.full_name || session.user.email!,
                        role: session.user.email === 'admin@sistema.com' ? 'admin' : 'professor',
                        active: true,
                      })
                      .select()
                      .single();
                    
                    if (createError) {
                      console.error('Erro ao criar perfil:', createError);
                      setProfile(null);
                    } else {
                      setProfile(newProfile);
                    }
                  } catch (createError) {
                    console.error('Erro geral ao criar perfil:', createError);
                    setProfile(null);
                  }
                } else {
                  setProfile(null);
                }
              } else {
                // Se é o usuário admin, certificar que tem o papel correto
                if (session.user.email === 'admin@sistema.com' && profileData && profileData.role !== 'admin') {
                  try {
                    const { data: updatedProfile, error: updateError } = await supabase
                      .from('usuarios')
                      .update({ role: 'admin' })
                      .eq('id', session.user.id)
                      .select()
                      .single();
                    
                    if (updateError) {
                      console.error('Erro ao atualizar perfil admin:', updateError);
                      setProfile(profileData);
                    } else {
                      setProfile(updatedProfile);
                    }
                  } catch (error) {
                    console.error('Erro ao atualizar perfil admin:', error);
                    setProfile(profileData);
                  }
                } else {
                  setProfile(profileData);
                }
              }
            } catch (error) {
              console.error('Erro geral ao buscar perfil:', error);
              setProfile(null);
            }
            
            setLoading(false);
          }, 100);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setLoading(false);
        } else if (session?.user) {
          // Para outros eventos como TOKEN_REFRESHED, apenas recarrega o perfil
          try {
            const { data: profileData, error } = await supabase
              .from('usuarios')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (error) {
              console.error('Erro ao recarregar perfil:', error);
            } else {
              setProfile(profileData);
            }
          } catch (error) {
            console.error('Erro geral ao recarregar perfil:', error);
          }
          setLoading(false);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Buscar perfil inicial
        supabase
          .from('usuarios')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profileData, error }) => {
            if (error) {
              console.error('Erro ao buscar perfil inicial:', error);
              setProfile(null);
            } else {
              setProfile(profileData);
            }
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => {
      authData?.subscription?.unsubscribe?.();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro ao fazer login:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro geral no login:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        console.error('Erro ao criar conta:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro geral no cadastro:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erro ao fazer logout:', error);
        throw error;
      }

      // Clear local state
      setUser(null);
      setSession(null);
      setProfile(null);

      // Force redirect to login
      window.location.href = '/';
    } catch (error) {
      console.error('Erro geral no logout:', error);
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (!session?.user) return;
    
    try {
      const { data: profileData, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Erro ao recarregar perfil:', error);
      } else {
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Erro geral ao recarregar perfil:', error);
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };
};