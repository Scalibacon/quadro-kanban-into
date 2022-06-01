SELECT pa.id_painel, pa.area 
FROM painelkanban pa

INNER JOIN kanbanpainelusuario pausu ON pausu.id_painel = pa.id_painel
WHERE pausu.id_usuario = ${id_usuario}::NUMERIC