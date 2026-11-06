# IABill

Sistema web de apoio à adequação à LGPD e ao RGPD. A IA redige documentos usando só o que a empresa já aprovou e recusa responder quando falta base.

Trabalho de Conclusão de Curso de Ciência da Computação da Unesc.

- **Autor:** Daniel Felisberto dos Santos
- **Orientação:** Matheus Leandro Ferreira

Os documentos gerados não têm validação jurídica formal e não substituem um profissional habilitado.

## Testar no site

A forma mais simples é usar **[iabill.com](https://iabill.com)**. Não é preciso instalar nada nem configurar chaves.

Entre com uma das contas da NexTech, empresa fictícia com dados fictícios. A senha de todas é `NexTech@2026`.

| E-mail | Papel |
| --- | --- |
| `ana.silva@nextech.com.br` | Administrador |
| `carlos.mendes@nextech.com.br` | Encarregado de Dados (DPO) |
| `juliana.rocha@nextech.com.br` | Usuário |

Essas contas são públicas, então não insira dados pessoais reais nelas.

### Roteiro sugerido

1. Entre com a conta da Ana Silva. O sistema abre o **Início** da unidade, com o que precisa de atenção.
2. No menu **Documentos**, gere um documento, revise e aprove. Depois de aprovado, ele não pode mais ser editado.
3. Abra o **Assistente IA** no menu e, em **Buscar trechos**, procure um assunto de um documento aprovado.
4. Na aba **Perguntar** do assistente, pergunte algo que não está nos documentos, como o faturamento da empresa. A IA deve recusar.
5. Clique no seu nome, no canto inferior do menu, abra **Auditoria** e veja o registro de tudo o que foi feito.

As funções de IA dependem da cota do Google Gemini. Se aparecer erro de limite, tente de novo mais tarde.

## Rodar localmente

Você precisa de JDK 21, Node.js 22 ou superior e Docker.

Para as funções de IA, crie uma chave gratuita no [Google AI Studio](https://aistudio.google.com/apikey). Sem a chave o sistema abre normalmente, mas busca, geração e aprovação de documentos ficam indisponíveis.

### 1. Banco de dados

Na raiz do projeto:

```bash
docker compose up -d
```

### 2. Backend

No Linux, macOS ou Git Bash:

```bash
cd backend
export GEMINI_API_KEY="sua-chave"
./mvnw spring-boot:run
```

No PowerShell:

```powershell
cd backend
$env:GEMINI_API_KEY = "sua-chave"
.\mvnw.cmd spring-boot:run
```

A API sobe em `http://localhost:8080`.

### 3. Frontend

Em outro terminal:

```bash
cd frontend
npm ci
npm run dev
```

Abra `http://localhost:5173`.

### 4. Primeiro acesso

O banco local começa vazio, sem as contas da NexTech. Crie uma conta na tela de cadastro.

O e-mail de confirmação não é enviado no ambiente local, então confirme a conta direto no banco, trocando o e-mail no comando:

```bash
docker exec lgpd-assistant-db psql -U lgpd_admin -d lgpd_assistant -c "UPDATE users SET email_verified = true WHERE email = 'seu-email@exemplo.com';"
```

## Rodar os testes

São 59 testes. Com o Docker ligado:

```bash
cd backend
./mvnw test
```

No Windows, se aparecer `Unable to establish loopback connection`, aponte para uma pasta que exista:

```bash
./mvnw test "-DargLine=-Djdk.net.unixdomain.tmpdir=C:\caminho\para\uma\pasta"
```
