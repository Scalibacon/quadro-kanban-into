SELECT 
    COUNT(distinct projeto) AS total
FROM kanbantarefa
WHERE 
    id_painel = ${id_painel}::NUMERIC
    AND status != 'Arquivado'