/* ******************* DASHS ******************* */
async function buscarDadosDashs(){
  try{
      await buscarDadosNumericosDash();
      
      montarGraficoStatus();
      montarGraficoPrioridade();
      montarGraficosResponsavel();
      montarGraficosMes();
  } catch(error){
      console.log('Erro ao buscar dados do dashboard ', error.message);
  }
}

async function buscarDadosNumericosDash(){
  try{
      const [resultProjetos, resultTarefas] = await Promise.all([
          KanbantarefaRepository.selectTotalProjetos({ id_painel: $scope.areaSelecionada.id_painel }),
          KanbantarefaRepository.selectTotalTarefas({ id_painel: $scope.areaSelecionada.id_painel }),
      ]);
      
      $scope.totalProjetos = resultProjetos[0].total || 0;
      $scope.totalTarefas = resultTarefas[0].total || 0;
      $scope.totalTarefasConcluidas = resultTarefas[0].total_concluidos || 0;
      $scope.totalTarefasAtrasadas = resultTarefas[0].total_atrasados || 0;
      
      $scope.progressoMedio = Math.round( (resultTarefas[0].total_concluidos * 100) / resultTarefas[0].total * 10 ) / 10 || 0;
      
      $scope.$apply();
  } catch(error){
      console.log('Erro ao buscar dados numéricos do dash ', error.message);
  }
}

async function montarGraficoStatus(){
  try {
      if(myChartTarefaStatus && myChartTarefaStatus.destroy) myChartTarefaStatus.destroy();
      
      const ctx = document.getElementById('dash-status').getContext('2d');
      
      const data = {
          labels: [''],
          datasets: [
              {
                label: 'Feito',
                data: [$scope.totalTarefasConcluidas],
                borderColor: 'rgba(1, 184, 170, 1)',
                backgroundColor: 'rgba(1, 184, 170, 0.5)',
                borderWidth: 2
              },
              {
                label: 'Entradas',
                data: [$scope.totalTarefas - $scope.totalTarefasConcluidas],
                borderColor: 'rgba(191, 191, 191, 1)',
                backgroundColor: 'rgba(191, 191, 191, 0.5)',
                borderWidth: 2,
              }
          ]
      };
      
      const config = {
        type: 'bar',
        data: data,
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            datalabels: {
              anchor: 'center',
              align: 'top',
              formatter: escondeZerosDoDatalabels
            }
          },
        },
      };
      
      myChartTarefaStatus= new Chart(ctx, config);
  } catch(error){
      console.log('Erro ao montar gráfico por status ', error.message);
      adicionarScriptsChart();
      
      setTimeout(montarGraficoStatus, 1000);
  }
}

async function montarGraficoPrioridade(){
  try {
      if(myChartTarefaPrioridade && myChartTarefaPrioridade.destroy) myChartTarefaPrioridade.destroy();
      
      const ctx = document.getElementById('dash-prioridade').getContext('2d');
      
      const result = await KanbantarefaRepository.selectTarefasPorPrioridade({ id_painel: $scope.areaSelecionada.id_painel });
      
      const data = {
          labels: ['Baixa', 'M\xE9dia', 'Alta'],
          datasets: [
              {
                  label: 'Testando ChartJS',
                  data: [
                      result[0].total_baixa,
                      result[0].total_media,
                      result[0].total_alta,
                  ],
                  backgroundColor: ['rgba(4, 190, 99, 0.5)', 'rgb(245, 210, 61, 0.5)', 'rgb(253, 126, 123, 0.5)'],
                  borderColor: ['rgba(4, 190, 99, 1)', 'rgb(245, 210, 61, 1)', 'rgb(253, 126, 123, 1)'],
                  borderWidth: 2
              },
          ]
      }
      
      const config = {
        type: 'doughnut',
        data: data,
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            datalabels: {
              anchor: 'center',
              align: 'center',
              formatter: escondeZerosDoDatalabels
            }
          },
        },
      };
      
      myChartTarefaPrioridade = new Chart(ctx, config);
  } catch(error){
      console.log('Erro ao montar gráfico por prioridade ', error.message);
      adicionarScriptsChart();
      
      setTimeout(montarGraficoPrioridade, 1000);
  }
}

async function montarGraficosResponsavel(){
  try{
      const listaResponsaveis = await KanbantarefaRepository.selectTarefasResponsavel({ id_painel: $scope.areaSelecionada.id_painel });
      
      montarGraficoResponsavelStatus(listaResponsaveis);
      montarGraficoResponsavelPrioridade(listaResponsaveis);
  } catch(error){
      console.log('Erro ao buscar tarefas por resposável ', error.message)
  }
}

async function montarGraficoResponsavelStatus(listaResponsaveis){
  try{
      if(myChartResponsavelStatus && myChartResponsavelStatus.destroy) myChartResponsavelStatus.destroy();
      
      const ctx = document.getElementById('dash-responsavel-status').getContext('2d');
      
      const data = {
          labels: listaResponsaveis.map( registro => registro.responsavel),
          datasets: [
              {
                  label: 'Feito',
                  data: listaResponsaveis.map( registro => registro.total_concluidos),
                  borderColor: 'rgba(1, 184, 170, 1)',
                  backgroundColor: 'rgba(1, 184, 170, 0.5)',
                  borderWidth: 2,
              },
              {
                  label: 'Entradas',
                  data: listaResponsaveis.map( registro => registro.total_tarefas - registro.total_concluidos),
                  borderColor: 'rgba(191, 191, 191, 1)',
                  backgroundColor: 'rgba(191, 191, 191, 0.5)',
                  borderWidth: 2,
              },
          ]
      };
      
      const config = {
        type: 'bar',
        data: data,
        options: {
          indexAxis: 'y',
          responsive: true,
          
          scales: {
              x: {
                  stacked: true
              },
              y: {
                  stacked: true
              }
          },
          
          plugins: {
            legend: {
              position: 'top',
            },
            datalabels: {
              anchor: 'center',
              align: 'center',
              formatter: escondeZerosDoDatalabels
            }
          },
        },
      };
      
      myChartResponsavelStatus = new Chart(ctx, config);
  } catch(error){
      console.log('Erro ao montar gráfico por status/responsável ', error.message);
      adicionarScriptsChart();
      
      setTimeout(montarGraficoResponsavelStatus, 1000);
  }
}

async function montarGraficoResponsavelPrioridade(listaResponsaveis){
  try{
      if(myChartResponsavelPrioridade && myChartResponsavelPrioridade.destroy) myChartResponsavelPrioridade.destroy();
      
      const ctx = document.getElementById('dash-responsavel-prioridade').getContext('2d');
      
      const data = {
          labels: listaResponsaveis.map( registro => registro.responsavel),
          datasets: [
              {
                  label: 'Baixa',
                  data: listaResponsaveis.map( registro => registro.total_baixas),
                  borderColor: 'rgba(5,190,100, 1)',
                  backgroundColor: 'rgba(5,190,100, 0.5)',
                  borderWidth: 2,
              },
              {
                  label: 'M\xE9dia',
                  data: listaResponsaveis.map( registro => registro.total_medias),
                  borderColor: 'rgba(245,209,58, 1)',
                  backgroundColor: 'rgba(245,209,58, 0.5)',
                  borderWidth: 2,
              },
              {
                  label: 'Alta',
                  data: listaResponsaveis.map( registro => registro.total_altas),
                  borderColor: 'rgba(253,125,122, 1)',
                  backgroundColor: 'rgba(253,125,122, 0.5)',
                  borderWidth: 2,
              },
          ]
      };
      
      const config = {
        type: 'bar',
        data: data,
        options: {
          indexAxis: 'y',
          responsive: true,
          
          scales: {
              x: {
                  stacked: true
              },
              y: {
                  stacked: true
              }
          },
          
          plugins: {
            legend: {
              position: 'top',
            },
            datalabels: {
              anchor: 'center',
              align: 'center',
              formatter: escondeZerosDoDatalabels
            }
          },
        },
      };
      
      myChartResponsavelPrioridade = new Chart(ctx, config);
  } catch(error){
      console.log('Erro ao montar gráfico por status/responsável ', error.message);
      adicionarScriptsChart();
      
      setTimeout(montarGraficoResponsavelPrioridade, 1000);
  }
}

async function montarGraficosMes(){
  try{
      const listaMes = await KanbantarefaRepository.selectTarefasMeses({ id_painel: $scope.areaSelecionada.id_painel });
      montarGraficoMesStatus(listaMes);
      montarGraficoMesPrioridade(listaMes)
  } catch(error){
      console.log('Erro ao buscar tarefas por mes ', error.message)
  }
}

function buscaValorMeses(listaMes, atributo){
  let array = [];
  
  for(let i = 0; i < MESES.length; i++){
      let dadosMes = listaMes.find( registro => registro.mes === i + 1);
      
      if(dadosMes && dadosMes[atributo]){
          array.push(dadosMes[atributo])
      } else {
          array.push(0);
      }
  }
  
  return array;
}

function montarGraficoMesStatus(listaMes){
  try{
      if(myChartMesStatus && myChartMesStatus.destroy) myChartMesStatus.destroy();
      
      const ctx = document.getElementById('dash-mes-status').getContext('2d');
      
      const data = {
          labels: MESES,
          datasets: [
              {
                  label: 'Feito',
                  data: buscaValorMeses(listaMes, 'total_concluidos'),
                  borderColor: 'rgba(1, 184, 170, 1)',
                  backgroundColor: 'rgba(1, 184, 170, 0.5)',
                  borderWidth: 2,
              },
              {
                  label: 'Entradas',
                  data: buscaValorMeses(listaMes, 'total_abertos'),
                  borderColor: 'rgba(191, 191, 191, 1)',
                  backgroundColor: 'rgba(191, 191, 191, 0.5)',
                  borderWidth: 2,
              },
          ]
      };
      
      const config = {
        type: 'bar',
        data: data,
        options: {
          responsive: true,
          scales: {
              x: { stacked: true },
              y: { stacked: true }
          },
          plugins: {
            legend: { position: 'top' },
            datalabels: {
              anchor: 'center',
              align: 'center',
              formatter: escondeZerosDoDatalabels
            }
          },
        },
      };
      
      myChartMesStatus = new Chart(ctx, config);
  } catch(error){
      console.log('Erro ao montar gráfico por status/mes ', error.message);
      adicionarScriptsChart();
      
      setTimeout(montarGraficoMesStatus, 1000);
  }
}

function montarGraficoMesPrioridade(listaMes){
  try{
      if(myChartMesPrioridade && myChartMesPrioridade.destroy) myChartMesPrioridade.destroy();
      
      const ctx = document.getElementById('dash-mes-prioridade').getContext('2d');
      
      const data = {
          labels: MESES,
          datasets: [
              {
                  label: 'Baixa',
                  data: buscaValorMeses(listaMes, 'total_baixas'),
                  borderColor: 'rgba(5,190,100, 1)',
                  backgroundColor: 'rgba(5,190,100, 0.5)',
                  borderWidth: 2,
              },
              {
                  label: 'M\xE9dia',
                  data: buscaValorMeses(listaMes, 'total_medias'),
                  borderColor: 'rgba(245,209,58, 1)',
                  backgroundColor: 'rgba(245,209,58, 0.5)',
                  borderWidth: 2,
              },
              {
                  label: 'Alta',
                  data: buscaValorMeses(listaMes, 'total_altas'),
                  borderColor: 'rgba(253,125,122, 1)',
                  backgroundColor: 'rgba(253,125,122, 0.5)',
                  borderWidth: 2,
              },
          ]
      };
      
      const config = {
        type: 'bar',
        data: data,
        options: {
          responsive: true,
          scales: {
              x: { stacked: true },
              y: { stacked: true }
          },
          plugins: {
            legend: { position: 'top' },
            datalabels: {
              anchor: 'center',
              align: 'center',
              formatter: escondeZerosDoDatalabels
            }
          },
        },
      };
      
      myChartMesPrioridade = new Chart(ctx, config);
  } catch(error){
      console.log('Erro ao montar gráfico por prioridade/mes ', error.message);
      adicionarScriptsChart();
      
      setTimeout(montarGraficoMesPrioridade, 1000);
  }
}

function escondeZerosDoDatalabels(value, index, values){
  if(value > 0){
      value = value.toString();
      value = value.split(/(?=(?:...)*$)/);
      value = value.join(',');
      return value;
  } else {
      value = "";
      return value;
  }
}

function adicionarScriptsChart(){
  try{
      if( Chart.register(ChartDataLabels) ) return;
  } catch(error){
      console.log('Erro com os bgl de chart');
      
      const chartScript = document.createElement('script'); 
      chartScript.setAttribute('src','https://cdn.jsdelivr.net/npm/chart.js@3.7.1/dist/chart.min.js');
      document.head.appendChild(chartScript);
      
      const datalabelsScript = document.createElement('script'); 
      datalabelsScript.setAttribute('src','https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0');
      document.head.appendChild(datalabelsScript);
  }
}