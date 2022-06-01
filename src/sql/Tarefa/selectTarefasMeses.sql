SELECT 
   EXTRACT(MONTH FROM data_solicitacao) AS mes,
   COUNT(id_tarefa) AS total_tarefas,
   COALESCE( SUM( CASE WHEN status = 'Concluido' THEN 1 ELSE 0 END ), 0 ) AS total_concluidos,
   COALESCE( SUM( CASE WHEN status != 'Concluido' THEN 1 ELSE 0 END ), 0 ) AS total_abertos,
   COALESCE( SUM( CASE WHEN prioridade = 'Baixa' THEN 1 ELSE 0 END ), 0 ) AS total_baixas,
   COALESCE( SUM( CASE WHEN prioridade = 'Media' THEN 1 ELSE 0 END ), 0 ) AS total_medias,
   COALESCE( SUM( CASE WHEN prioridade = 'Alta' THEN 1 ELSE 0 END ), 0 ) AS total_altas
FROM kanbantarefa

WHERE 
    status != 'Arquivado' 
    AND responsavel IS NOT NULL
    AND id_painel = ${id_painel}::NUMERIC

GROUP BY EXTRACT(MONTH FROM data_solicitacao)