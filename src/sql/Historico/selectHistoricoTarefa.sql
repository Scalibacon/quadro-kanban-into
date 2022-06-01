SELECT 
    id_historico, id_tarefa, comentario, autor, TO_CHAR(data, 'DD/MM/YYYY HH24:MI:SS') AS data
FROM kanbanhistorico
WHERE id_tarefa = ${id_tarefa}::NUMERIC
ORDER BY data DESC