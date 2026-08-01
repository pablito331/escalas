# Escalas de Louvor — Roadmap

## ✅ Concluído

### Infraestrutura
- [x] Migração do Google AI Studio para GitHub Pages
- [x] Build automatizado via GitHub Actions
- [x] Variáveis de ambiente via GitHub Secrets (sem expor credenciais no repositório)
- [x] PWA com service worker, cache offline e manifest

### Autenticação e Ministérios
- [x] Tela de login obrigatória com Google
- [x] Onboarding: criar ministério ou entrar com código de convite
- [x] Código de convite gerado automaticamente a partir do nome do ministério
- [x] Aprovação de membros pelo líder
- [x] Papéis: super_admin / lider / membro
- [x] Sessão persistente — não desloga ao recarregar, só ao clicar Sair
- [x] Login automático por email via planilha índice central (sem precisar digitar código em dispositivo novo)
- [x] Líder adicionado automaticamente como membro ao criar ministério

### Painel Super Admin
- [x] Carrega todos os ministérios automaticamente da planilha índice central
- [x] Ver membros ativos e pendentes por ministério
- [x] Aprovar membros e promover/rebaixar entre líder e membro
- [x] Copiar código de convite de qualquer ministério
- [x] Aba de Feedbacks dos usuários

### App Principal
- [x] Dados sem mock — começa sempre vazio
- [x] Perfil editável com funções (talentos) e telefone
- [x] Botão de feedback flutuante para todos os usuários — com aba de doação via PIX
- [x] Badge na navbar indicando membros aguardando aprovação
- [x] Indicador de sincronização (Salvando / Sincronizado / Erro)
- [x] Banner de token expirado com botão de reconectar
- [x] Banner de modo offline
- [x] Sync automático ao voltar online
- [x] Limites de linhas aumentados (500 membros, 2000 escalas/músicas, 5000 escalados)
- [x] FAB de adicionar membro visível no mobile
- [x] Botão "Gerar Links" substitui IA no repertório (Cifra Club + YouTube)

---

## 🔲 Pendente / A Fazer

### Bugs Conhecidos
- [ ] `total_membros` na planilha índice não é atualizado automaticamente quando membro entra/sai
- [ ] Confirmação antes de excluir escala, membro ou música (#7 da análise)
- [ ] Token OAuth expira em 1h — melhorar fluxo de renovação silenciosa

### Painel Super Admin
- [ ] Filtro/busca por nome de ministério
- [ ] Remover ministério do índice pelo painel
- [ ] Estatísticas: total de escalas, músicas por ministério

### App — Funcionalidades
- [ ] Notificação push quando líder aprova membro
- [ ] Líder pode aprovar membros diretamente dentro do app (sem precisar ir no super admin)
- [ ] Confirmação antes de excluir dados importantes
- [ ] Filtro de escalas por data/status na listagem
- [ ] Exportar escala como PDF ou imagem para compartilhar no WhatsApp
- [ ] Histórico de presença por membro

### App — UX/Mobile
- [ ] Melhorar tela de membros no mobile (cards mais compactos)
- [ ] Swipe para confirmar/recusar presença na escala
- [ ] Dark mode

### Técnico
- [ ] Renovação silenciosa do token OAuth antes de expirar
- [ ] Retry automático em caso de falha de sync (fila offline)
- [ ] Testes automatizados básicos

---

### Ideias Futuras
- [ ] Múltiplos ministérios por usuário — alternar entre eles no app
- [ ] Integração com WhatsApp para envio automático de escalas
- [ ] Múltiplos ministérios por usuário (ex: louvor + mídia na mesma igreja)
- [ ] Calendário visual de escalas
- [ ] Chat interno por escala (comentários/avisos)
- [ ] Aplicativo nativo (React Native) a partir do mesmo codebase
