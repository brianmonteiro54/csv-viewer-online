    // E-mail fixo para CC(copia para o Equipe Operacional EDN)
    const fixedRecipient = "comunicacao.alunos@escoladanuvem.org";
    
    // Codificação do campo CC
    const recipientsCC = encodeURIComponent(fixedRecipient);
document.getElementById('file-input').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) {
        alert('Please upload a file before submitting.');
        return;
    }

    Papa.parse(file, {
        header: true,
        complete: function (results) {
            processCSV(results.data);
        }
    });
});

let csvData = []; // Variável para armazenar os dados do CSV

document.getElementById('file-input').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) {
        alert('Por favor, carregue um arquivo antes de enviar.');
        return;
    }

    Papa.parse(file, {
        header: true,
        complete: function (results) {
            csvData = results.data; // Armazenar os dados do CSV
            processCSV(csvData); // Chama a função para processar os dados e preencher a tabela
        }
    });
});

document.getElementById('copy-performance-btn').addEventListener('click', function () {
    // Esconder a tabela antes de copiar o desempenho
    document.getElementById('results').style.display = 'none'; // Ocultar a tabela de resultados
    document.getElementById('performance-order-container').style.display = 'block'; // Exibir a área para os e-mails

    // Carregar dinamicamente o script desempenho.js
    const script = document.createElement('script');
    script.src = 'desempenho.js';
    document.body.appendChild(script);
});

function processCSV(data) {
    const resultsTableBody = document.querySelector('#results-table tbody');
    const resultsDiv = document.getElementById('results');
    resultsTableBody.innerHTML = ''; // Limpar a tabela existente

    data.forEach(row => {
        const fullName = row['Student'].split(', ').reverse().join(' ').trim();
        const kcScore = row['Knowledge Checks Current Score']; // KC
        const labScore = row['Labs Current Score']; // LAB
        const totalScore = row['desempenho_das_entregas']; // Total
        const email = row['SIS Login ID']; // Email do aluno

        const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(email)}&subject=${encodeURIComponent('Desempenho e Faltas - Aviso importante!! - ' + fullName)}&body=${encodeURIComponent('Seu desempenho...')}&cc=${recipientsCC}`;

        const rowElement = document.createElement('tr');
        rowElement.innerHTML = `
            <td>${fullName}</td>
            <td>${totalScore}</td>
            <td>${labScore}</td>
            <td>${kcScore}</td>
            <td><a href="${outlookUrl}" target="_blank">Enviar E-mail</a></td>
            <td><button>Copiar texto</button></td>
        `;
        resultsTableBody.appendChild(rowElement);
    });

    // Exibir os resultados, se houver dados
    if (data.length > 0) {
        resultsDiv.style.display = 'block';
    }
}



function getGreeting() {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 12) {
        return "Bom dia";
    } else if (hours >= 12 && hours < 18) {
        return "Boa tarde";
    } else {
        return "Boa noite";
    }
}


function processCSV(data) {
    fetch('students.json')
        .then(response => response.json())
        .then(studentsData => {
            const resultsTableBody = document.querySelector('#results-table tbody');
            const resultsDiv = document.getElementById('results');
            resultsTableBody.innerHTML = '';

            const filteredData = data
                .filter(row => {
                    const fullName = row['Student'] ? row['Student'].split(', ').reverse().join(' ').trim() : '';
                    const kcScore = row['Knowledge Checks Current Score'];
                    const kcScoreValue = kcScore ? parseFloat(kcScore.replace(',', '.')) : NaN;
                    const labScore = row['Labs Current Score'];
                    const labScoreValue = labScore ? parseFloat(labScore.replace(',', '.')) : NaN;
                    const totalScore = row['desempenho_das_entregas'];
                    const totalScoreValue = totalScore ? parseFloat(totalScore.replace(',', '.')) : NaN;
                    return fullName && fullName !== 'Testar aluno' && !isNaN(kcScoreValue) && kcScoreValue < 101;
                })
                .sort((a, b) => {
                    const nameA = a['Student'].split(', ').reverse().join(' ').trim();
                    const nameB = b['Student'].split(', ').reverse().join(' ').trim();
                    return nameA.localeCompare(nameB);
                });

            if (filteredData.length > 0) {
                resultsDiv.style.display = 'block';
            }

            filteredData.forEach(row => {
                const fullName = row['Student'].split(', ').reverse().join(' ').trim();
                const kcScore = row['Knowledge Checks Current Score']; // KC
                const labScore = row['Labs Current Score']; // LAB
                const totalScore = row['desempenho_das_entregas']; // Total
                const email = row['SIS Login ID']; // Email do aluno

                // Ajuste para "KC" e "Lab"
                const pendingKCs = Object.keys(row)
                .filter(key => 
                    key.match(/^\s*\d+\s*[-–]\s*(.*\s*)?KC.*$/) ||  // Detecta qualquer formato de KC com base em "KC"
                    key.match(/^\d+-.*-.*Lab/i)||  // Detecta qualquer formato de Lab com base em "Lab"
                    key.match(/^Atividade\s*[:|]\s*.+/) // Detecta qualquer formato de Atividade
                )
                .filter(key => {
                    const value = row[key];
                    return value !== null && value !== undefined && parseFloat(value.replace(',', '.')) === 0;
                })
                .map(key => key.replace(/\s*\(\d+\)$/, '').trim()); 
            
                // Obtém a saudação correta
                const greeting = getGreeting();
                const pendingKCsStr = pendingKCs.length > 0 ? pendingKCs.join('\n') : "Nenhum! Parabéns, você concluiu todos os KCs e laboratórios disponíveis até o momento! Essa conquista reflete sua dedicação e compromisso em aproveitar ao máximo essa oportunidade. Continue estudando e revisando os conteúdos, pois o próximo grande passo está à sua frente: a certificação Cloud Practitioner! Essa certificação é uma porta de entrada para oportunidades no mercado, e você já está na direção certa. Lembre-se: todo o esforço investido agora é um investimento no seu futuro.";
                const message = `${greeting}, ${fullName}. Seu desempenho nos KCs está em ${kcScore}%, e seu desempenho nos Labs está em ${labScore}%. Você ainda tem alguns KCs/Labs pendentes:\n\n${pendingKCsStr}\n\nPara aprovação no curso AWS re/Start, os seguintes requisitos devem ser atendidos:\n\n1. Conclusão de 100% dos Laboratórios: Todos os laboratórios do curso devem ser completados com pontuação total.\n\n2. Pontuação em KCs: Obter uma pontuação mínima de 70%.\n\n3. Presença nas Aulas: Manter uma presença mínima de 80% em todas as aulas.`;
                const emailSubject = `Desempenho e Faltas - Aviso importante!! - ${fullName} - Escola da Nuvem`;
                const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(email)}?cc=${recipientsCC}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(message)}`;


                const rowElement = document.createElement('tr');
                rowElement.innerHTML = `
                    <td>${fullName}</td>
                    <td>${totalScore}</td>
                    <td>${labScore}</td>
                    <td>${kcScore}</td>
                    <td> <a href="${outlookUrl}" target="_blank" class="botao-enviar-email">Enviar E-mail</a></td>
                    <td><button class="botao-copiado" onclick="copyEmailContent('${encodeURIComponent(message)}', '${email}', '${fullName}', this)">Copiar texto</button></td>
                `;

                resultsTableBody.appendChild(rowElement);
            });
        });
}

let timeoutId;  // Variável global para armazenar o temporizador da notificação

function copyEmailContent(message, email, fullName, button) {
    if (!fullName) {
        console.error('Nome completo não fornecido!');
        return;
    }
        
    // Decodifica a mensagem
    const decodedMessage = decodeURIComponent(message);

  const textToCopy = decodeURIComponent(message); // Ajuste conforme necessário
  navigator.clipboard.writeText(textToCopy).then(function() {
    // Exibe a notificação com a animação
    showNotification();

    // Muda a cor do botão quando clicado
    button.classList.add('copiado'); // Adiciona a classe para mudar a cor do botão

  }).catch(function(err) {
    console.error('Erro ao copiar o texto: ', err);
  });

    // Codifica o assunto corretamente
    const subject = encodeURIComponent(`Desempenho e Faltas - Aviso importante!! - ${fullName} - Escola da Nuvem`);

    // Gera a URL com CC e BCC
    const manualEmailUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(email)}?cc=${recipientsCC}&subject=${subject}`;

    // Abre a nova guia com o e-mail preenchido corretamente
    window.open(manualEmailUrl, '_blank');

}

function showNotification() {
  const notificacao = document.getElementById('notificacao');
  const barraProgresso = document.getElementById('barra-progresso');
  
  // Se a notificação já estiver visível, removemos ela antes de exibir novamente
  if (timeoutId) {
    clearTimeout(timeoutId);  // Limpa o temporizador anterior
    notificacao.classList.remove('show');  // Remove a classe 'show' para esconder
  }

  // Adiciona a classe 'show' para tornar a notificação visível
  notificacao.classList.add('show');
  
  // Reseta a animação da barra de progresso (remove a animação e adiciona de novo)
  barraProgresso.style.animation = 'none';  // Remove a animação
  // Força o navegador a processar a mudança
  void barraProgresso.offsetWidth; // Recalcula o layout
  barraProgresso.style.animation = 'progresso 10s linear forwards';  // Reaplica a animação

  // Remove a classe 'show' e esconde a notificação após 10 segundos
  timeoutId = setTimeout(function() {
    notificacao.classList.remove('show');
  }, 5000); 
}

