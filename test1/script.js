// Processo usando Graphviz
document.getElementById('grafoForm').addEventListener('submit', (event) => {
    event.preventDefault();

    const dotInput = document.getElementById('dotInput').value;
    const origem = document.getElementById('origem').value.trim();
    const destino = document.getElementById('destino').value.trim();
    const resultadoDiv = document.getElementById('resultado');
    const resultadoMinimoDiv = document.getElementById('resultadoMinimo');

    //Limpar resultado anterior
    resultadoDiv.innerHTML = '';
    resultadoMinimoDiv.innerHTML = '';

    //Redenrizar o grafo com Viz.js
    const viz = new Viz();
    viz.renderSVGElement(dotInput)
    .then(element => {
        resultadoDiv.appendChild(element);
    })
    .catch(error => {
        console.log('Erro ao redenrizar o grafo:', error);
        resultadoDiv.innerHTML = '<p style="color: red;">Erro ao renderizar o grafo. Verifique o formato DOT.</p>';
    });

    //Calcular o caminho mínimo (VITERBI)
    const grafo = parseDotToGraph(dotInput);
    const caminhoMinimo = viterbi(grafo, origem, destino);

    if (caminhoMinimo) {
        //Gerar um novo grafo DOT apenas com o caminho mínimo
        const dotCaminhoMinimo = generateDotFromPath(caminhoMinimo, grafo);
        viz.renderSVGElement(dotCaminhoMinimo).then(element => {
            resultadoMinimoDiv.appendChild(element);
        }).catch(error => {
            console.error('Erro ao redenrizar o caminho mínimo: ', error);
            resultadoMinimoDiv.innerHTML = '<p style="color: red;">Erro ao renderizar o caminho mínimo.</p>';
        });
    } else {
        resultadoMinimoDiv.innerHTML = '<p style="color: red;">Caminho não encontrado.</p>';
    }
});

// FUNCION converter DOT em um grafo (obj js)
function parseDotToGraph(dotContent) {
    const grafo = {};
    const linhas = dotContent.split('\n');

    linhas.forEach(linha => {
        if (linha.includes('->')) {
            const [origemDestino, peso] = linha.split('[');
            const [origem, destino] = origemDestino.split('->').map(s => s.trim());
            const pesoNum = parseInt(peso?.match(/\d+/)?.[0] || 1);

            if (!grafo[origem]) grafo[origem] = {};
            grafo[origem][destino] = pesoNum;
        }
    });

    return grafo;
}

// FUNCTION algoritmo Viterbi Grafos CAMINHO PROVAVEL
// function viterbi(grafo, origem, destino) {
//     const nos = Object.keys(grafo); 
//     const probMax = {};       // Probabilidade máxima de cada nó
//     const anteriores = {};     // Armazena o melhor caminho

//     // Inicializa as probabilidades com -Infinity (log probabilidade negativa)
//     nos.forEach(no => {
//         probMax[no] = -Infinity;
//         anteriores[no] = null;
//     });
//     probMax[origem] = 0; // Começamos com log(1) = 0 (probabilidade inicial 100%)

//     // Fila de prioridade para os nós a serem visitados
//     const nosNaoVisitados = new Set(nos);

//     while (nosNaoVisitados.size > 0) {
//         // Encontra o nó com a maior probabilidade atual
//         let noAtual = null;
//         for (const no of nosNaoVisitados) {
//             if (noAtual === null || probMax[no] > probMax[noAtual]) {
//                 noAtual = no;
//             }
//         }

//         // Remove o nó atual da fila
//         nosNaoVisitados.delete(noAtual);

//         // Se chegamos ao destino, reconstruímos o caminho
//         if (noAtual === destino) {
//             const caminho = [];
//             let no = destino;
//             while (no !== null) {
//                 caminho.unshift(no);
//                 no = anteriores[no];
//             }
//             return caminho;
//         }

//         // Atualiza os vizinhos com a melhor probabilidade de transição
//         for (const vizinho in grafo[noAtual]) {
//             const probTransicao = Math.log(grafo[noAtual][vizinho]); // Log para somar probabilidades
//             const novaProb = probMax[noAtual] + probTransicao;

//             if (novaProb > probMax[vizinho]) {
//                 probMax[vizinho] = novaProb;
//                 anteriores[vizinho] = noAtual;
//             }
//         }
//     }

//     return null; // Caminho não encontrado
// }


// FUNCTION algoritmo Viterbi Grafos ADAPTADO(Caminho Mínimo) 
function viterbi(grafo, origem, destino) {
    const nos = Object.keys(grafo); // Obtém todos os nós do grafo
    const distancias = {};
    const anteriores = {};

    // Inicializa distâncias e anteriores
    nos.forEach(no => {
        distancias[no] = Infinity;
        anteriores[no] = null;
    });
    distancias[origem] = 0;

    // Fila de prioridade (nós não visitados)
    const nosNaoVisitados = new Set(nos);

    while (nosNaoVisitados.size > 0) {
        // Encontra o nó com a menor distância
        let noAtual = null;
        for (const no of nosNaoVisitados) {
            if (noAtual === null || distancias[no] < distancias[noAtual]) {
                noAtual = no;
            }
        }

        // Remove o nó atual da fila de não visitados
        nosNaoVisitados.delete(noAtual);

        // Se chegou ao destino, retorna o caminho
        if (noAtual === destino) {
            const caminho = [];
            let no = destino;
            while (no !== null) {
                caminho.unshift(no);
                no = anteriores[no];
            }
            return caminho;
        }

        // Atualiza as distâncias dos vizinhos
        for (const vizinho in grafo[noAtual]) {
            const distancia = distancias[noAtual] + grafo[noAtual][vizinho];
            if (distancia < distancias[vizinho]) {
                distancias[vizinho] = distancia;
                anteriores[vizinho] = noAtual;
            }
        }
    }

    return null; // Caminho não encontrado
}

// FUNCTION gerar o novo DOT do caminho mínimo
function generateDotFromPath(caminho, grafo) {
    let dot = 'digraph G {\n';
    for (let i = 0; i < caminho.length - 1; i++) {
        const origem = caminho[i];
        const destino = caminho[i + 1];
        const peso = grafo[origem][destino];
        dot += `  ${origem} -> ${destino} [label=${peso}];\n`;
    }
    dot += '}';
    return dot;
}