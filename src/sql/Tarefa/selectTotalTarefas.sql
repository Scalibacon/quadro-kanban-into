SELECT 
   COUNT(DISTINCT id_tarefa) AS total,
   SUM( CASE WHEN status = 'Concluido' THEN 1 ELSE 0 END ) AS total_concluidos,
   SUM ( CASE WHEN previsao_entrega::DATE < now()::DATE AND status != 'Concluido' THEN 1 ELSE 0 END ) AS total_atrasados
FROM kanbantarefa
WHERE 
    id_painel = ${id_painel}::NUMERIC
    AND status != 'Arquivado'