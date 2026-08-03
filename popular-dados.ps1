$ErrorActionPreference = "Stop"
$baseUrl = "https://iabill.com/api/v1"

Write-Host "=== 1. Criando a empresa (signup) ===" -ForegroundColor Cyan
$signup = Invoke-RestMethod -Uri "$baseUrl/auth/signup" -Method Post -ContentType "application/json" -SessionVariable session -Body (@{
    tenantName        = "NexTech Solucoes em TI Ltda"
    tenantDocumentId  = "12345678000100"
    tenantCountry     = "BR"
    adminUsername     = "ana.silva"
    adminEmail        = "ana.silva@nextech.com.br"
    adminPassword     = "NexTech@2026"
} | ConvertTo-Json)

$tenantId = $signup.tenantId
$anaId = $signup.userId
Write-Host "Tenant criado: $tenantId" -ForegroundColor Green
Write-Host "Admin (ana.silva) criado: $anaId" -ForegroundColor Green

Write-Host "`n=== 2. Criando Workspaces ===" -ForegroundColor Cyan
$matriz = Invoke-RestMethod -Uri "$baseUrl/workspaces" -Method Post -ContentType "application/json" -WebSession $session -Body (@{
    tenantId   = $tenantId
    name       = "Matriz Florianopolis"
    type       = "MATRIZ"
    documentId = "12345678000100"
} | ConvertTo-Json)
$matrizId = $matriz.id
Write-Host "Workspace Matriz criado: $matrizId" -ForegroundColor Green

$filial = Invoke-RestMethod -Uri "$baseUrl/workspaces" -Method Post -ContentType "application/json" -WebSession $session -Body (@{
    tenantId   = $tenantId
    name       = "Filial Sao Paulo"
    type       = "FILIAL"
    documentId = "12345678000181"
} | ConvertTo-Json)
$filialId = $filial.id
Write-Host "Workspace Filial criado: $filialId" -ForegroundColor Green

Write-Host "`n=== 3. Criando Usuarios adicionais ===" -ForegroundColor Cyan
$carlos = Invoke-RestMethod -Uri "$baseUrl/users" -Method Post -ContentType "application/json" -WebSession $session -Body (@{
    tenantId = $tenantId
    username = "carlos.mendes"
    email    = "carlos.mendes@nextech.com.br"
    password = "NexTech@2026"
    role     = "USER"
} | ConvertTo-Json)
$carlosId = $carlos.id
Write-Host "Usuario carlos.mendes (encarregado/DPO) criado: $carlosId" -ForegroundColor Green

$juliana = Invoke-RestMethod -Uri "$baseUrl/users" -Method Post -ContentType "application/json" -WebSession $session -Body (@{
    tenantId = $tenantId
    username = "juliana.rocha"
    email    = "juliana.rocha@nextech.com.br"
    password = "NexTech@2026"
    role     = "USER"
} | ConvertTo-Json)
$julianaId = $juliana.id
Write-Host "Usuario juliana.rocha (RH) criado: $julianaId" -ForegroundColor Green

Write-Host "`n=== 4. Vinculando usuarios aos workspaces ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$baseUrl/users/$anaId/workspaces/$matrizId" -Method Post -WebSession $session | Out-Null
Invoke-RestMethod -Uri "$baseUrl/users/$anaId/workspaces/$filialId" -Method Post -WebSession $session | Out-Null
Invoke-RestMethod -Uri "$baseUrl/users/$carlosId/workspaces/$matrizId" -Method Post -WebSession $session | Out-Null
Invoke-RestMethod -Uri "$baseUrl/users/$julianaId/workspaces/$matrizId" -Method Post -WebSession $session | Out-Null
Write-Host "Vinculos criados." -ForegroundColor Green

Write-Host "`n=== 5. Criando e processando documentos (Matriz) ===" -ForegroundColor Cyan

$inventario = Invoke-RestMethod -Uri "$baseUrl/documents" -Method Post -ContentType "application/json" -WebSession $session -Body (@{
    workspaceId    = $matrizId
    createdByUserId = $anaId
    type           = "INVENTARIO_DADOS"
    title          = "Inventario de Dados Pessoais - Matriz 2026"
} | ConvertTo-Json)
$inventarioId = $inventario.id

$conteudoInventario = @"
A NexTech Solucoes em TI Ltda, empresa de desenvolvimento de software SaaS para gestao empresarial, realiza o tratamento dos seguintes dados pessoais:

1. Dados de clientes pessoa juridica (usuarios do sistema): nome completo, CPF, e-mail corporativo, cargo, telefone de contato. Finalidade: cadastro e autenticacao de acesso a plataforma. Base legal: execucao de contrato (Art. 7, V, LGPD).

2. Dados de funcionarios: nome, CPF, RG, endereco residencial, dados bancarios, historico profissional. Finalidade: gestao de folha de pagamento e obrigacoes trabalhistas. Base legal: cumprimento de obrigacao legal (Art. 7, II, LGPD).

3. Dados de navegacao coletados via cookies no site institucional: endereco IP, paginas visitadas, tempo de sessao. Finalidade: melhoria da experiencia do usuario e analytics. Base legal: consentimento (Art. 7, I, LGPD).

Os dados sao armazenados em servidores na regiao Sul do Brasil (AWS sa-east-1), com retencao de 5 anos apos o termino do contrato para dados de clientes, e conforme exigencias trabalhistas para dados de funcionarios (minimo 5 anos apos rescisao). Medidas de seguranca incluem criptografia em transito (HTTPS) e em repouso, controle de acesso baseado em papel (RBAC), e auditoria de todas as operacoes.
"@

Invoke-RestMethod -Uri "$baseUrl/documents/$inventarioId/content" -Method Post -ContentType "text/plain; charset=utf-8" -WebSession $session -Body $conteudoInventario | Out-Null
Write-Host "Documento 'Inventario de Dados' criado e processado (chunks+embeddings gerados)." -ForegroundColor Green

$rat = Invoke-RestMethod -Uri "$baseUrl/documents" -Method Post -ContentType "application/json" -WebSession $session -Body (@{
    workspaceId    = $matrizId
    createdByUserId = $carlosId
    type           = "RAT"
    title          = "Registro de Atividades de Tratamento - Matriz 2026"
} | ConvertTo-Json)
$ratId = $rat.id

$conteudoRat = @"
Registro de Atividades de Tratamento (RAT) da NexTech Solucoes em TI Ltda.

Atividade 1: Gestao de contas de clientes SaaS. Categoria de titulares: representantes de empresas clientes. Categoria de dados: identificacao (nome, CPF), contato (e-mail, telefone), cargo. Compartilhamento: nenhum compartilhamento com terceiros. Prazo de retencao: 5 anos apos termino do contrato.

Atividade 2: Folha de pagamento e beneficios de funcionarios. Categoria de titulares: colaboradores da empresa. Categoria de dados: identificacao, dados bancarios, dados de saude (para plano medico). Compartilhamento: operadora de plano de saude e instituicao bancaria, mediante contrato de operador de dados (DPA). Prazo de retencao: conforme legislacao trabalhista vigente.

Atividade 3: Suporte tecnico ao cliente. Categoria de titulares: usuarios finais da plataforma. Categoria de dados: identificacao, historico de interacoes de suporte. Compartilhamento: nenhum. Prazo de retencao: 2 anos apos ultimo atendimento.

Encarregado pelo tratamento de dados (DPO): Carlos Mendes, contato dpo@nextech.com.br.
"@

Invoke-RestMethod -Uri "$baseUrl/documents/$ratId/content" -Method Post -ContentType "text/plain; charset=utf-8" -WebSession $session -Body $conteudoRat | Out-Null
Write-Host "Documento 'RAT' criado e processado." -ForegroundColor Green

Write-Host "`n=== 6. Gerando Politica de Privacidade via IA (reaproveitando contexto acima) ===" -ForegroundColor Cyan
$politica = Invoke-RestMethod -Uri "$baseUrl/documents" -Method Post -ContentType "application/json" -WebSession $session -Body (@{
    workspaceId    = $matrizId
    createdByUserId = $anaId
    type           = "POLITICA_PRIVACIDADE"
    title          = "Politica de Privacidade - NexTech 2026"
} | ConvertTo-Json)
$politicaId = $politica.id

$geracao1 = Invoke-RestMethod -Uri "$baseUrl/documents/$politicaId/generate" -Method Post -ContentType "application/json" -WebSession $session -Body (@{
    instruction = "Escreva uma politica de privacidade completa, cobrindo quais dados sao coletados, finalidades, bases legais, prazos de retencao e direitos dos titulares."
} | ConvertTo-Json)
Write-Host "Politica de Privacidade gerada via IA (status: $($geracao1.status))" -ForegroundColor Green

Write-Host "`n=== 7. Demonstrando o fluxo de rejeicao e regeneracao ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$baseUrl/documents/$politicaId/reject" -Method Put -ContentType "application/json" -WebSession $session -Body (@{
    reason = "Faltou mencionar explicitamente o prazo de resposta a solicitacoes de titulares (15 dias, conforme Art. 19 LGPD)."
} | ConvertTo-Json) | Out-Null
Write-Host "Documento rejeitado com motivo (demonstra o fluxo human-in-the-loop)." -ForegroundColor Yellow

$geracao2 = Invoke-RestMethod -Uri "$baseUrl/documents/$politicaId/generate" -Method Post -ContentType "application/json" -WebSession $session -Body (@{
    instruction = "Escreva uma politica de privacidade completa, incluindo explicitamente o prazo de 15 dias para resposta a solicitacoes de titulares conforme Art. 19 da LGPD."
} | ConvertTo-Json)
Write-Host "Politica regenerada apos rejeicao (status: $($geracao2.status))" -ForegroundColor Green

Invoke-RestMethod -Uri "$baseUrl/documents/$politicaId/review" -Method Put -WebSession $session | Out-Null
Invoke-RestMethod -Uri "$baseUrl/documents/$politicaId/approve" -Method Put -WebSession $session | Out-Null
Write-Host "Politica revisada e aprovada." -ForegroundColor Green

Write-Host "`n=== 8. Aprovando tambem o Inventario e o RAT ===" -ForegroundColor Cyan
foreach ($docId in @($inventarioId, $ratId)) {
    Invoke-RestMethod -Uri "$baseUrl/documents/$docId/generate" -Method Post -ContentType "application/json" -WebSession $session -Body (@{
        instruction = "Resuma o conteudo deste documento de forma clara e objetiva."
    } | ConvertTo-Json) | Out-Null
    Invoke-RestMethod -Uri "$baseUrl/documents/$docId/review" -Method Put -WebSession $session | Out-Null
    Invoke-RestMethod -Uri "$baseUrl/documents/$docId/approve" -Method Put -WebSession $session | Out-Null
}
Write-Host "Inventario e RAT gerados, revisados e aprovados." -ForegroundColor Green

Write-Host "`n=== 9. Documento na Filial (deixado em DRAFT, para mostrar variedade de estados) ===" -ForegroundColor Cyan
$relatorio = Invoke-RestMethod -Uri "$baseUrl/documents" -Method Post -ContentType "application/json" -WebSession $session -Body (@{
    workspaceId    = $filialId
    createdByUserId = $anaId
    type           = "RELATORIO_CONFORMIDADE"
    title          = "Relatorio de Conformidade - Filial SP 2026"
} | ConvertTo-Json)
Write-Host "Relatorio de Conformidade criado (status DRAFT, aguardando acao)." -ForegroundColor Green

Write-Host "`n=== 10. Plano de Acao: sugestao via IA + tarefa manual ===" -ForegroundColor Cyan
$sugestoes = Invoke-RestMethod -Uri "$baseUrl/action-items/suggest?workspaceId=$matrizId" -Method Post -WebSession $session
Write-Host "IA sugeriu $($sugestoes.Count) tarefas. Aprovando as 2 primeiras..." -ForegroundColor Yellow

$aprovadas = 0
foreach ($sugestao in $sugestoes) {
    if ($aprovadas -ge 2) { break }
    Invoke-RestMethod -Uri "$baseUrl/action-items" -Method Post -ContentType "application/json" -WebSession $session -Body (@{
        workspaceId = $matrizId
        title       = $sugestao.title
        description = $sugestao.description
        source      = "AI_SUGGESTED"
    } | ConvertTo-Json) | Out-Null
    $aprovadas++
}
Write-Host "$aprovadas tarefas sugeridas pela IA foram aprovadas." -ForegroundColor Green

$tarefaManual = Invoke-RestMethod -Uri "$baseUrl/action-items" -Method Post -ContentType "application/json" -WebSession $session -Body (@{
    workspaceId = $matrizId
    title       = "Revisar contratos com fornecedores de nuvem"
    description = "Confirmar clausulas de protecao de dados (DPA) com a AWS e outros fornecedores criticos."
} | ConvertTo-Json)

Invoke-RestMethod -Uri "$baseUrl/action-items/$($tarefaManual.id)/status" -Method Put -ContentType "application/json" -WebSession $session -Body (@{
    status = "IN_PROGRESS"
} | ConvertTo-Json) | Out-Null
Write-Host "Tarefa manual criada e marcada como 'Em Andamento'." -ForegroundColor Green

Write-Host "`n=== 11. Conversa de exemplo com o agente de chat ===" -ForegroundColor Cyan
$conversa = Invoke-RestMethod -Uri "$baseUrl/chat/conversations?workspaceId=$matrizId" -Method Post -WebSession $session

$msg1 = Invoke-RestMethod -Uri "$baseUrl/chat/conversations/$($conversa.id)/messages" -Method Post -ContentType "application/json" -WebSession $session -Body (@{
    message = "Quais documentos ja foram aprovados neste workspace?"
} | ConvertTo-Json)
Write-Host "Agente respondeu: $($msg1.content.Substring(0, [Math]::Min(100, $msg1.content.Length)))..." -ForegroundColor Gray

Write-Host "`n=== CONCLUIDO ===" -ForegroundColor Cyan
Write-Host "Tenant ID: $tenantId"
Write-Host "Login admin: ana.silva@nextech.com.br / NexTech@2026"
Write-Host "Acesse https://iabill.com para ver os dados." -ForegroundColor Green
