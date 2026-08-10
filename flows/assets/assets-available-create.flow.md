# Procedimento de Inclusão de Disponibilidade (Asset Availability)
com as tabelas:
3: assets_available que tem por objetivo registrar o histórico de disponibilidades
4: cfg_units_assets_tags que tem por objetivo armazenar as características de cada setor e relacionar com o último lançamento em assets_available.
5: o percentual de disponibilidade é obtido pela soma de asset_available_rate e last_asset_available_rate

Permissao de acesso a localizacao do usuario logado deve estar permitida

operation_record é um campo que armazena a quantidade unidades (Km, h e etc) de funcionamento dos ativos

created_at é um campo que armazena a data e hora atual no formato ISO 8601 com fuso horário America/Sao_Paulo
reported_at é um campo que armazena a data e hora atual no formato ISO 8601 com fuso horário America/Sao_Paulo

processing_id = 2

unit_latitude = units.latitude da unit_id
unit_longitude = units.longitude da unit_id
reported_latitude = gps do usuario logado
reported_longitude = gps do usuario logado

Se is_web = true:
    - assets_available.is_web = true
    - assets_available.unit_reported_distance_m = 0
Se is_web = false:
    - assets_available.is_web = false
    - assets_available.unit_reported_distance_m = distancia entre a unidade e o usuario logado em metros

provider_company_id = users.teams.company_id do usuario logado

Caso exista imagem a ser upload:
    - Validar se a imagem é valida
    - Fazer upload da imagem para o R2 Cloudflare
    - Obter o path da imagem(file_path): companies/1/units/{unit_id}/assets_available
    - Obter o nome da imagem(file_name): {asset_available_id}.{ext}

Visualização e Experiência do Usuário (UI/UX):
- Todas as imagens de evidência/reporte devem ser exibidas com thumbnails otimizados (OptimizedImage).
- Ao clicar na imagem, deve ser utilizado o componente PhotoViewer para visualização em tela cheia.
- O PhotoViewer deve suportar:
    - Zoom in/out (pinch ou botões)
    - Rotação da imagem
    - Navegação entre múltiplas fotos (se aplicável)
    - Download ou compartilhamento da evidência original
- Os detalhes (UnitAssetTagAvailableDetails) devem sempre exibir a miniatura da última evidência disponível para conferência rápida.

Ao inserir o registro em assets_available:
- Localizar na tabela cfg_units_assets_tags o registro que tem a mesma unit_id, asset_tag_id e asset_tag_sub_id obtendo o id do registro em cfg_units_assets_tags
- Atualizar os campos:
    - cfg_units_assets_tags.last_asset_available_id = id do registro inserido em assets_available
    - cfg_units_assets_tags.last_created_at = assets_available.created_at;
    - cfg_units_assets_tags.last_is_available = assets_available.is_available;
    - cfg_units_assets_tags.last_processing_id = 2;
    - cfg_units_assets_tags.last_created_user_id = assets_available.created_user_id;
    - cfg_units_assets_tags.last_created_at = assets_available.created_at;
    - cfg_units_assets_tags.last_file_path = assets_available.file_path;
    - cfg_units_assets_tags.last_file_name = assets_available.file_name;
    - cfg_units_assets_tags.last_comments = assets_available.comments;
    - cfg_units_assets_tags.last_asset_unavailable_reason_id = assets_available.asset_unavailable_reason_id;
    - cfg_units_assets_tags.last_reported_at = assets_available.reported_at;
    - cfg_units_assets_tags.last_reported_user_id = assets_available.reported_user_id;
    Se assets_available.is_available = true:
        - cfg_units_assets_tags.last_asset_available_rate = cfg_units_assets_tag.asset_available_rate;
    Se assets_available.is_available = false:
        - cfg_units_assets_tags.last_asset_available_rate = 0;
    - cfg_units_assets_tags.last_is_on = assets_available.is_on;
    - cfg_units_assets_tags.last_operation_record = assets_available.operation_record;
    - cfg_units_assets_tags.last_o_id = assets_available.o_id;
    - cfg_units_assets_tags.last_provider_company_id = assets_available.provider_company_id;

Padrões de Interface:
- UnitView: Thumbnails na lista de disponibilidade utilizam PhotoViewer.
- UnitAssetTagAvailableForm: O preview da foto capturada utiliza PhotoViewer.
- UnitAssetTagAvailableDetails: A evidência fotográfica do reporte é exibida ao lado do logo da empresa e abre o PhotoViewer.

Após a inclusão e atualização da disponibilidade, enviar mensagem via WhatsApp nas seguintes condições:

- Se assets_available.is_available anterior é diferente da recém cadastrada:
    Se assets_available.is_available recém cadastrada = true:
      - msg_is_available = "*[NOVA ATUALIZAÇÃO]*\nDISPONÍVEL\n"
    Se assets_available.is_available recém cadastrada = false:
      - msg_is_available = "*[NOVA ATUALIZAÇÃO]*\nINDISPONÍVEL\n"

- Se assets_available.is_available anterior é igual da recém cadastrada:
    Se assets_available.is_available recém cadastrada = false:
      - msg_is_available = "INDISPONÍVEL\n"

- Texto a ser enviado
        msg = msg_is_available +
        {unit_description}\n
        {tag_tag_sub_description}\n
        {last_asset_unavailable_reason_description}\n
        {last_comments}\n\n
        {last_reported_user_name_short}\n
        {last_reported_at}h"

- Imagem a ser enviada
        imgUrl = last_file_path + "/" + last_file_name

- API
    method: POST
    endpoint: VITE_API_N8N_WEBHOOK/VITE_API_N8N_WEBHOOK_WHATSAPP_SEND_MSG
    body:
    {
        "msg":"msg",
        "imgUrl":"imgUrl"
    }
