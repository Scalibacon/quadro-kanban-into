SELECT
    COUNT(kpu.id_painel_usuario) AS total
FROM kanbanpainelusuario kpu
WHERE 
    kpu.id_painel = ${id_painel}::NUMERIC
    AND kpu.tipo = 'ADM'
    AND kpu.id_usuario != ${id_usuario}::NUMERIC