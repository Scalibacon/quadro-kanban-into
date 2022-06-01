SELECT
    kpu.id_painel_usuario, kpu.id_painel, kpu.id_usuario, kpu.tipo, usu.nome
FROM kanbanpainelusuario kpu
INNER JOIN usuario usu ON usu.idusuario = kpu.id_usuario
WHERE kpu.id_painel = ${id_painel}::NUMERIC
ORDER BY kpu.tipo ASC, usu.nome ASC