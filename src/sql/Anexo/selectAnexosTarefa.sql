SELECT
    id_anexo, id_tarefa, nome_arquivo, extensao, arquivo
FROM kanbananexo
WHERE id_tarefa = ${id_tarefa}
ORDER BY id_anexo ASC