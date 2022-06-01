SELECT 
    id_tarefa, id_painel, responsavel, solicitante, prioridade, status, nome, projeto,
    data_solicitacao, previsao_entrega, data_entrega, data_aprovacao,
    CASE WHEN previsao_entrega::DATE < now()::DATE AND status != 'Concluido' THEN TRUE ELSE FALSE END AS atrasado
FROM kanbantarefa
WHERE id_painel = ${idPainel}::NUMERIC
AND status != 'Arquivado'