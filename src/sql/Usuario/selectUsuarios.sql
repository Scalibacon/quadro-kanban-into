SELECT * FROM
(
SELECT
    usu.idusuario AS id_usuario, usu.nome    
FROM usuario usu
LEFT JOIN empregados emp ON emp.idempregado = usu.idempregado
LEFT JOIN gruposempregados gemp ON gemp.idempregado = emp.idempregado
LEFT JOIN grupo gp ON gp.idgrupo = gemp.idgrupo
WHERE
    (${nome_usuario}::text = 'TODOS' OR usu.nome ILIKE '%' || ${nome_usuario}::text || '%')
    AND (${nome_grupo}::text = 'TODOS' OR gp.nome ILIKE '%' || ${nome_grupo}::text || '%')
GROUP BY usu.idusuario, usu.nome
ORDER BY usu.nome ASC
) query