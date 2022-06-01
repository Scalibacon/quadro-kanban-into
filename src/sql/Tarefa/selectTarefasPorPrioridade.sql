SELECT 
   COUNT(id_tarefa) AS total_tarefas,
   COALESCE( SUM( CASE WHEN prioridade = 'Baixa' THEN 1 ELSE 0 END ), 0) AS total_baixa,
   COALESCE( SUM( CASE WHEN prioridade = 'Media' THEN 1 ELSE 0 END ), 0) AS total_media,
   COALESCE( SUM( CASE WHEN prioridade = 'Alta' THEN 1 ELSE 0 END ), 0) AS total_alta
FROM kanbantarefa
WHERE 
    id_painel = ${id_painel}::NUMERIC
    AND status != 'Arquivado'