SELECT 
    DISTINCT projeto 
FROM kanbantarefa
WHERE status != 'Arquivado' AND id_painel = ${id_painel}::NUMERIC AND projeto != ''
ORDER BY projeto ASC