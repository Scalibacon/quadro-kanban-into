$scope.tipoKanbanSelecionado;
$scope.areaSelecionada;
$scope.prioridadeSelecionada;
$scope.mostrarSomenteAtrasados = false;

$scope.tipoTela = 1; 
/*  1 = inicial; 
    2 = kanban; 
    3 = formulário; */

$scope.tarefaSelecionadaHistorico = [];
$scope.tarefaSelecionada = {};
$scope.tarefaSelecionadaAntesDeAlterar = {};
$scope.teveAlteracao = false;
$scope.txtComentarioHistorico = '';
$scope.tarefaSelecionadaArquivos = [];

$scope.listaTarefasTodas = [];
$scope.listaTarefas = [];
$scope.listaAreas = [];
$scope.nomeProjetos = [];
$scope.membrosPainel = [];
$scope.tipoUsuario;

$scope.statusTarefas = [
  {label: 'Backlog Priorizado', banco: 'Priorizado', css: 'priorizado'},  
  {label: 'Em Andamento', banco: 'Em Andamento', css: 'andamento'},  
  {label: 'Pendente', banco: 'Pendente', css: 'pendente'},  
  {label: 'Conclu\xEDdo', banco: 'Concluido', css: 'concluido'},  
  {label: 'Backlog Geral', banco: 'Backlog', css: 'backlog'}
];

$scope.quantidadeTarefas = {
    "Priorizado": 0,
    "Em Andamento": 0,
    "Pendente": 0,
    "Concluido": 0,
    "Backlog": 0
}

$scope.filtros = {
    palavraChave: ''
};

let myChartTarefaStatus, myChartTarefaPrioridade, myChartResponsavelStatus, myChartResponsavelPrioridade,
    myChartMesStatus, myChartMesPrioridade;

const MESES = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

/********* MOCKS *********/
function setDragEvents(){
    const tarefasDiv = document.querySelectorAll('.tarefa');
    const containersDiv = document.querySelectorAll('.kanban-status');
    
    tarefasDiv.forEach( tarefaDiv => {
        tarefaDiv.removeEventListener('dragstart', handleDragTarefa);
        tarefaDiv.removeEventListener('dragend', handleDragEndTarefa);
        
        tarefaDiv.addEventListener('dragstart', handleDragTarefa);
        tarefaDiv.addEventListener('dragend', handleDragEndTarefa);
    });
    
    containersDiv.forEach( containerDiv => {
        containerDiv.removeEventListener('drop', handleDropContainer);
        containerDiv.removeEventListener('dragover', handleDragOverContainer);
        containerDiv.removeEventListener('dragleave', handleDragLeaveContainer);
        
        containerDiv.addEventListener('drop', handleDropContainer);
        containerDiv.addEventListener('dragover', handleDragOverContainer);
        containerDiv.addEventListener('dragleave', handleDragLeaveContainer);
    });
}

function handleDragOverContainer(event){
    event.preventDefault();
    
    // const containerDiv = buscaContainer('kanban-status', event.target);
    const containerDiv = event.target.closest('.kanban-status');
    containerDiv.classList.add('dragging');
}

function handleDragLeaveContainer(event){
    event.preventDefault();
    
    // const containerDiv = buscaContainer('kanban-status', event.target);
    const containerDiv = event.target.closest('.kanban-status');
    containerDiv.classList.remove('dragging');
}

async function handleDropContainer(event){
    event.preventDefault();
    
    // const containerDiv = buscaContainer('kanban-status', event.target);
    const containerDiv = event.target.closest('.kanban-status');
    const novoStatus = containerDiv.id;
    
    const idTarefa = event.dataTransfer.getData("idTarefa");
    setarTarefaSelecionada( $scope.listaTarefasTodas.find( tarefa => tarefa.id_tarefa == idTarefa) );
    
    $scope.tarefaSelecionada.status = novoStatus;
    
    await $scope.salvarOuAtualizar(false);
    atualizarQuantidade();
    
    // precisa setar os eventos dnv pq o elemento arrastado era renderizado dnv e perdia
    setDragEvents();
}

function handleDragTarefa(event){
    event.dataTransfer.setData("idTarefa", event.target.id);
}

function handleDragEndTarefa(event){
    const containersDiv = document.querySelectorAll('.kanban-status');
    containersDiv.forEach( containerDiv => {
        containerDiv.classList.remove('dragging');
    });
}

// recursiva pra procurar o container pai específico, mas o js já tem uma função parecida (closest)
function buscaContainer(classeContainer, elementoAtual){
    if(elementoAtual.classList.contains(classeContainer)){
        return elementoAtual
    }
    
    return buscaContainer(classeContainer, elementoAtual.parentElement);
}
/*************************/

$scope.onInit = async function(){
    // fechar dropdown dos membros ao clicar fora
    document.addEventListener('mousedown', event => {
        if(
            event.target.closest('#membros-container') || event.target.closest('.membros-button') || event.target.closest('.swal2-container') ||
            event.target.closest('#modal-usuarios') || event.target.id == 'mock-click' || $scope.tipoTela !== 2
        )
            return;
            
        $scope.alternarDiv('membros-container', true);
    })
    
    $scope.listaAreas = await KanbanpainelRepository.selectPainelUsuario({
        id_usuario: USER_LOGGED.idUsuario
    })
    
    //atualiza o quadro a cada x milissegundos
    setInterval( () => {
        if($scope.tipoTela === 2){
            $scope.abrirQuadro(true);
        }
    }, 1000 * 60)
    
    adicionarScriptsChart();
    
    document.getElementById('mock-click').click();
}

function resetarTarefa(){
    $scope.tarefaSelecionada = {
        prioridade: 'Baixa',
        status: 'Backlog',
        id_painel: $scope.areaSelecionada.id_painel
    };
    $scope.tarefaSelecionadaArquivos = [];
    $scope.tarefaSelecionadaHistorico = [];
}

$scope.alterarFiltroPrioridade = function(novaPrioridade){
    if($scope.prioridadeSelecionada === novaPrioridade){
        $scope.prioridadeSelecionada = null;
    } else {
        $scope.prioridadeSelecionada = novaPrioridade;
    }
    
    $scope.aplicarFiltros();
}

$scope.toggleFiltroAtraso = function(){
    $scope.mostrarSomenteAtrasados = !$scope.mostrarSomenteAtrasados;
    $scope.aplicarFiltros();
}

$scope.visualizarKanban = function(){
    const radioTipoSelecionado = document.querySelector('input[name="radio-tipo"]:checked');
    
    const radioAreaSelecionado = document.querySelector('input[name="radio-area"]:checked');
    
    if(!radioAreaSelecionado || !radioTipoSelecionado){
        return appService.showAlert('error', "Selecione as op\xE7\xF5es corretamente!", "", false);
    } 
    
    $scope.tipoKanbanSelecionado = radioTipoSelecionado.value;
    $scope.areaSelecionada = JSON.parse(radioAreaSelecionado.value);
    
    buscarMembros();
    
    $scope.abrirQuadro(true);
}

$scope.trocarTipoKanban = novoTipo => {
    $scope.tipoKanbanSelecionado = novoTipo;
}

$scope.abrirQuadro = async (deveAtualizar) => {
    if(deveAtualizar){
        $scope.listaTarefasTodas = await KanbantarefaRepository.selectTarefasPainel({ idPainel: $scope.areaSelecionada.id_painel });
        // document.getElementById('mock-click').click();
        buscarDadosDashs();
    }
    $scope.aplicarFiltros();
    resetarTarefa();;
    
    $scope.tipoTela = 2;
    $scope.$apply();
}

$scope.aplicarFiltros = function(){
    $scope.listaTarefas = $scope.listaTarefasTodas.slice(0);
    
    $scope.listaTarefas = $scope.listaTarefas.filter( tarefa => {
        let passouPeloFiltroPrioridade = false;
        let passouPeloFiltroAtrasado = false;
        let passouPeloFiltroPalavraChave = false;
        
        if(!$scope.prioridadeSelecionada || tarefa.prioridade === $scope.prioridadeSelecionada){
            passouPeloFiltroPrioridade = true;
        }
        
        if(!$scope.mostrarSomenteAtrasados || tarefa.atrasado){
            passouPeloFiltroAtrasado = true;
        }
        
        if(!$scope.filtros.palavraChave || 
          (
            (tarefa.responsavel && tarefa.responsavel.toUpperCase().includes($scope.filtros.palavraChave.toUpperCase())) ||
            (tarefa.nome && tarefa.nome.toUpperCase().includes($scope.filtros.palavraChave.toUpperCase())) ||
            (tarefa.projeto && tarefa.projeto.toUpperCase().includes($scope.filtros.palavraChave.toUpperCase())) ||
            (tarefa.solicitante && tarefa.solicitante.toUpperCase().includes($scope.filtros.palavraChave.toUpperCase()))
          )
        ){
            passouPeloFiltroPalavraChave = true
        }
        
        return passouPeloFiltroPrioridade && passouPeloFiltroAtrasado && passouPeloFiltroPalavraChave;
    });
    
    atualizarQuantidade();
    
    $timeout( () => setDragEvents(), 500 );
}

function atualizarQuantidade(){
    for(let i in $scope.quantidadeTarefas){
        $scope.quantidadeTarefas[i] = $scope.listaTarefas.filter( tarefa => tarefa.status === i).length;
    }
}

function setarTarefaSelecionada(tarefa){
    $scope.tarefaSelecionada = tarefa;
    formatarDatasDaTarefa();
    
    $scope.tarefaSelecionadaAntesDeAlterar = Object.assign({}, $scope.tarefaSelecionada);
}

$scope.abrirFormulario = async tarefa => {
    if(!tarefa){
        resetarTarefa();
    } else {
        setarTarefaSelecionada(tarefa);
        buscarHistorico();
        buscarAnexos();
    }
    buscarNomeProjetos();
    $timeout( $scope.tipoTela = 3 );
}

$scope.abrirTelaAreas = function(){
    $scope.tipoTela = 1;
}

async function buscarNomeProjetos(){
    try {
        $scope.nomeProjetos = await KanbantarefaRepository.selectNomeProjetos($scope.areaSelecionada);
        document.getElementById('mock-click').click();
    } catch(error){
        console.log('Erro ao buscar nome de projetos =>', error.message);
    }
}

async function buscarMembros(){
    try {
        $scope.membrosPainel = await KanbanpainelusuarioRepository.selectUsuariosPainel({id_painel: $scope.areaSelecionada.id_painel});
        verificaTipoUsuario();
        document.getElementById('mock-click').click();
    } catch(error){
        console.log('Erro ao buscar membros =>', error.message);
    }
}

function verificaTipoUsuario(){
    const usuario = $scope.membrosPainel.find( membro => membro.id_usuario === USER_LOGGED.idUsuario);
    
    if(usuario){
        $scope.tipoUsuario = usuario.tipo;
        return;
    }
    
    $scope.tipoUsuario = false;
}

async function buscarHistorico(){
    try {
        $scope.tarefaSelecionadaHistorico = await KanbanhistoricoRepository.selectHistoricoTarefa($scope.tarefaSelecionada);
        document.getElementById('mock-click').click();
    } catch(error){
        console.log('Erro ao buscar histórico =>', error.message);
    }
}

async function buscarAnexos(){
    try {
        $scope.tarefaSelecionadaArquivos = await KanbananexoRepository.selectAnexosTarefa($scope.tarefaSelecionada);
        document.getElementById('mock-click').click();
    } catch(error){
        console.log('Erro ao buscar anexos =>', error.message);
    }
}

$scope.excluirAnexo = async function(event, anexo){
    try{
        event.stopPropagation();
        
        const resposta = await Swal.fire({
            title: `Deseja excluir o arquivo ${anexo.nome_arquivo}?`,
            text: "Arquivos exclu\xEDdos n\xE3o podem ser restaurados",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Excluir',
            cancelButtonText: 'Cancelar',
        });
        
        if(!resposta.isConfirmed) return;
        
        if(!$scope.tarefaSelecionada.id_tarefa){
            //se tiver inserindo tarefa exclui da lista de tarefas
             $timeout( $scope.tarefaSelecionadaArquivos = $scope.tarefaSelecionadaArquivos.filter( arquivo => arquivo.name !== anexo.name) );
        } else {
            //se tiver alterando tarefa exclui do banco
            await KanbananexoRepository.remove(anexo);
            await gravarComentarioNoHistorico('Exclus\xE3o de ' + anexo.nome_arquivo);
            appService.showAlert('success', "Arquivo deletado com sucesso!", "", false);
            
            buscarAnexos();
            buscarHistorico();
        }
    } catch(error){
        console.log('Erro ao excluir anexo =>', error.message);
    }
}

function comparaAlteracao(propriedade, textoPraAddHistorico){
    let antes = $scope.tarefaSelecionadaAntesDeAlterar[propriedade];
    let depois = $scope.tarefaSelecionada[propriedade];
    
    if(antes !== depois){
        $scope.teveAlteracao = true;
        $scope.txtComentarioHistorico += textoPraAddHistorico;
    }
}

function formatarDatasDaTarefa(){
    if($scope.tarefaSelecionada.data_solicitacao)
        $scope.tarefaSelecionada.data_solicitacao = new Date($scope.tarefaSelecionada.data_solicitacao);
        
    if($scope.tarefaSelecionada.previsao_entrega)
        $scope.tarefaSelecionada.previsao_entrega = new Date($scope.tarefaSelecionada.previsao_entrega);
        
    if($scope.tarefaSelecionada.data_entrega)
        $scope.tarefaSelecionada.data_entrega = new Date($scope.tarefaSelecionada.data_entrega);
        
    if($scope.tarefaSelecionada.data_aprovacao)
        $scope.tarefaSelecionada.data_aprovacao = new Date($scope.tarefaSelecionada.data_aprovacao);
}

$scope.salvarOuAtualizar = async function(deveAtualizarTela = true){
    try{
        if(!$scope.tarefaSelecionada.nome || !$scope.tarefaSelecionada.projeto){
            return appService.showAlert('error', "Preencha os campos corretamente!", "", false);
        }
        
        if(!$scope.tarefaSelecionada.id_tarefa){
            //insert
            await KanbantarefaRepository.create($scope.tarefaSelecionada);
            const ultimaTarefa = await KanbantarefaRepository.selectUltimoId();
            $scope.tarefaSelecionada.id_tarefa = ultimaTarefa[0].id_tarefa;
            
            await gravarComentarioNoHistorico('Cria\xE7\xE3o da Tarefa');
            await gravarArquivos($scope.tarefaSelecionadaArquivos);
            
            appService.showAlert('success', "Tarefa criada com sucesso!", "", false);
        } else {
            //update
            await KanbantarefaRepository.update($scope.tarefaSelecionada);
            
            if(deveAtualizarTela){
                appService.showAlert('success', "Tarefa alterada com sucesso!", "", false);
            }
            
            formatarTextoHistorico();
        }
        
        if(deveAtualizarTela) $scope.abrirQuadro(true);
        
        document.getElementById('mock-click').click();
    } catch(error){
        appService.showAlert('error', "Erro ao gravar tarefa", "", false);
        console.log('Erro ao salvar ou atualizar: ', error.message);
    }
}

function formatarTextoHistorico(){
    //paranaue pra adicionar log de alterações no histórico
    $scope.txtComentarioHistorico = 'Altera\xE7\xE3o de';
    $scope.teveAlteracao = false;
    
    comparaAlteracao('nome', ' Nome da Tarefa,');
    comparaAlteracao('projeto', ' Projeto,');
    comparaAlteracao('responsavel', ' Respons\xE1vel,');
    comparaAlteracao('solicitante', ' Solicitante,');
    comparaAlteracao('data_solicitacao', ' Data de Solicita\xE7\xE3o,');
    comparaAlteracao('previsao_entrega', ' Previs\xE3o de Entrega,');
    comparaAlteracao('data_entrega', ' Data de Entrega,');
    comparaAlteracao('data_aprovacao', ' Data de Aprova\xE7\xE3o,');
    comparaAlteracao('prioridade', ' Prioridade,');
    comparaAlteracao('status', ' Situa\xE7\xE3o,');
    comparaAlteracao('solicitante', ' Solicitante,');
    
    if(!$scope.teveAlteracao) return;
    
    $scope.txtComentarioHistorico = $scope.txtComentarioHistorico.replace(/,\s*$/, "");
    gravarComentarioNoHistorico($scope.txtComentarioHistorico);
}

async function gravarComentarioNoHistorico(comentario){
    if(!$scope.tarefaSelecionada.id_tarefa) return false;
    
    const data = new Date();
    const data_str = `${data.getFullYear()}-${data.getMonth() + 1}-${data.getDate()} ${data.getHours()}:${data.getMinutes()}:${data.getSeconds()}`;
    
    await KanbanhistoricoRepository.create({
        id_tarefa: $scope.tarefaSelecionada.id_tarefa,
        autor: USER_LOGGED.nomeUsuario,
        comentario: comentario,
        data: data_str
    })
}

$scope.salvarComentario = async function(){
    try {
        console.log($scope.tarefaSelecionada.comentario);
        if(!$scope.tarefaSelecionada.comentario){
            return appService.showAlert('error', "Digite um coment\xE1rio v\xE1lido!", " ", false);
        }
        
        const resposta = await Swal.fire({
          title: 'Deseja salvar seu coment\xE1rio?',
          text: "Coment\xE1rios n\xE3o podem ser exclu\xEDdos do hist\xF3rico",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Salvar',
          cancelButtonText: 'Cancelar',
        });
        
        if(!resposta.isConfirmed) return;
        
        await gravarComentarioNoHistorico($scope.tarefaSelecionada.comentario);
        
        $scope.tarefaSelecionada.comentario = '';
        $scope.alternarDiv('shrink-historico');
        buscarHistorico();
        return appService.showAlert('success', "Coment\xE1rio adicionado ao hist\xF3rico!", " ", false);
        
    } catch(error){
        console.log('Erro ao salvar no log => ', error.message);
    }
}

async function gravarArquivos(arquivos){
    try{
        let txtHistorico = 'Inclus\xE3o de ';
        
        for(let i = 0; i < arquivos.length; i++){
            const arquivo = arquivos[i];
            const arquivoBase64 = await arquivoParaBase64(arquivo);
            
            await KanbananexoRepository.create({
                id_tarefa: $scope.tarefaSelecionada.id_tarefa,
                nome_arquivo: arquivo.name,
                arquivo: arquivoBase64,
                extensao: arquivo.name.split('.').pop()
            })
            
            txtHistorico += arquivo.name + ', ';
        }
        
        txtHistorico = txtHistorico.replace(/,\s*$/, "");
        await gravarComentarioNoHistorico(txtHistorico);
        
        buscarHistorico();
        buscarAnexos();
        
        return appService.showAlert('success', "Arquivos gravados com sucesso!", " ", false);
    } catch(error){
        console.log('Erro ao gravar arquivos =>', error.message);
    }
}

$scope.setarArquivos = async function(){
    try{
        if($scope.tarefaSelecionada.id_tarefa){
            await gravarArquivos(Array.from(document.getElementById('myFile').files));
            return buscarAnexos();
        }
        
        $scope.tarefaSelecionadaArquivos = Array.from($scope.tarefaSelecionadaArquivos).concat(Array.from(document.getElementById('myFile').files));
        
    } catch(error){
        console.log('Erro ao setar arquivos =>', error.message)
    }
}

$scope.baixarAnexo = function(anexo){
    if(!anexo.id_anexo) return false;
    
    const a = document.createElement('a');

    a.download = anexo.nome_arquivo;
    a.href = anexo.arquivo;
    a.click();
}

$scope.arquivarTarefa = async function(){
    try{
        const resposta = await Swal.fire({
            title: `Deseja arquivar a tarefa?`,
            text: "Tarefas arquivadas n\xE3o s\xE3o listadas nos quadros",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Arquivar',
            cancelButtonText: 'Cancelar',
        });
        
        if(!resposta.isConfirmed) return;
        
        $scope.tarefaSelecionada.status = 'Arquivado';
        $scope.salvarOuAtualizar(true);
    } catch(error){
        console.log('Erro ao arquivar tarefa =>', error.message)
    }
}

$scope.removerMembro = async function(membro){
    if($scope.tipoUsuario !== 'ADM') return false;
    
    const resposta = await Swal.fire({
        title: `Deseja excluir o membro ${membro.nome}?`,
        text: "Membros exclu\xEDdos n\xE3o poder\xE3o visualizar o quadro",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Excluir',
        cancelButtonText: 'Cancelar',
    });
    
    if(!resposta.isConfirmed) return;
    
    const totalAdms = await buscaTotalAdmsSemUsuario();
    
    if(membro.tipo !== 'ADM' || (totalAdms && totalAdms > 0)){
        await KanbanpainelusuarioRepository.remove(membro);
    } else {
        appService.showAlert('error', "N\xE3o \xE9 poss\xEDvel deixar o quadro sem administradores!", "", false);
    }
    
    await buscarMembros();
    $scope.$apply();
}

$scope.mudarTipoMembro = async function(membro){
    const totalAdms = await buscaTotalAdmsSemUsuario();
    
    if(membro.tipo !== 'ADM' || (totalAdms && totalAdms > 0)){
        membro.tipo = membro.tipo === 'ADM' ? 'Membro' : 'ADM';
    
        await KanbanpainelusuarioRepository.update(membro);
    } else {
        appService.showAlert('error', "N\xE3o \xE9 poss\xEDvel deixar o quadro sem administradores!", "", false);
    }
    
    await buscarMembros();
    $scope.$apply();
}

async function buscaTotalAdmsSemUsuario(){
    const listaAdms = $scope.membrosPainel.filter( membro => membro.id_usuario !== USER_LOGGED.idUsuario && membro.tipo === 'ADM' );
    
    return listaAdms.length;
    
    // const result = await KanbanpainelusuarioRepository.selectOutrosAdms({
    //     id_painel: $scope.areaSelecionada.id_painel,
    //     id_usuario: USER_LOGGED.idUsuario
    // });
    
    // if(result.length <= 0) return 0;
    
    // return result[0].total;
}

$scope.buscarUsuarios = async () => {
    try{
        const filtros = {
            nome_usuario: $scope.filtroUsuarios || 'TODOS',
            nome_grupo: $scope.filtroGrupos || 'TODOS'
        }
        
        $scope.usuariosEncontrados = await KanbanpainelusuarioRepository.selectUsuarios(filtros);
        
        $scope.$apply();
    } catch(error){
        console.log('Erro ao buscar usuarios => ', error.message)
    }
}

$scope.handleUsuariosKeydown = event => {
    if(event.key === 'Enter' ) $scope.buscarUsuarios();
}

$scope.adicionarUsuario = async usuario => {
    if($scope.tipoUsuario !== 'ADM') return false;
    
    if($scope.membrosPainel.find( membro => membro.id_usuario == usuario.id_usuario)) return false;
    
    await KanbanpainelusuarioRepository.create({
        id_painel: $scope.areaSelecionada.id_painel,
        id_usuario: usuario.id_usuario,
        tipo: 'Membro'
    });
    
    await buscarMembros();
}

async function arquivoParaBase64(arquivo){
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(arquivo);
        reader.onload = function() {
            resolve(reader.result);
        }
    });   
}

$scope.alternarDiv = function(divId, deveTirar = false){
    if(deveTirar){
        return document.getElementById(divId).classList.remove('expand');
    }
    
    document.getElementById(divId).classList.toggle('expand');
};

$scope.abrirModal = idModal => {
    $("#" + idModal).modal("show");
}