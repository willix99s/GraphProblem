// Grafo pré-definido (mais complexo)
const grafoDot = `
digraph G {
  Loja -> Armazém_A [label=10];
  Loja -> Armazém_B [label=15];
  Armazém_A -> Destino_X [label=20];
  Armazém_A -> Destino_Y [label=25];
  Armazém_B -> Destino_X [label=30];
  Armazém_B -> Destino_Y [label=10];
  Destino_X -> Destino_Y [label=5];
  Armazém_A -> Centro_Distribuição [label=12];
  Armazém_B -> Centro_Distribuição [label=8];
  Centro_Distribuição -> Destino_Z [label=18];
  Destino_Z -> Destino_W [label=7];
  Destino_W -> Destino_X [label=6];
  Destino_W -> Destino_Y [label=9];
}
`;

// Renderiza o grafo completo ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    const mapaRotasDiv = document.getElementById('mapaRotas');
    const viz = new Viz();

    viz.renderSVGElement(grafoDot)
        .then(element => {
            mapaRotasDiv.appendChild(element);
        })
        .catch(error => {
            console.error('Erro ao renderizar o grafo:', error);
            mapaRotasDiv.innerHTML = '<p style="color: red;">Erro ao renderizar o grafo.</p>';
        });
});

// Processo para calcular a rota mais curta
document.getElementById('rotaForm').addEventListener('submit', (event) => {
    event.preventDefault();

    const origem = document.getElementById('origem').value.trim();
    const destino = document.getElementById('destino').value.trim();
    const rotaMaisCurtaDiv = document.getElementById('rotaMaisCurta');

    // Limpar resultado anterior
    rotaMaisCurtaDiv.innerHTML = '';

    // Calcular a rota mais curta usando Viterbi
    const grafo = parseDotToGraph(grafoDot);
    const rotaMaisCurta = viterbi(grafo, origem, destino);

    if (rotaMaisCurta) {
        // Gerar um novo grafo DOT apenas com a rota mais curta
        const dotRotaMaisCurta = generateDotFromPath(rotaMaisCurta, grafo);
        const viz = new Viz();
        viz.renderSVGElement(dotRotaMaisCurta)
            .then(element => {
                rotaMaisCurtaDiv.appendChild(element);
            })
            .catch(error => {
                console.error('Erro ao renderizar a rota mais curta:', error);
                rotaMaisCurtaDiv.innerHTML = '<p style="color: red;">Erro ao renderizar a rota mais curta.</p>';
            });
    } else {
        rotaMaisCurtaDiv.innerHTML = '<p style="color: red;">Rota não encontrada.</p>';
    }
});

// Função para converter DOT em um grafo (objeto JavaScript)
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

// Algoritmo de Viterbi adaptado para grafos
function viterbi(grafo, origem, destino) {
    const nos = Object.keys(grafo);
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

// Função para gerar um novo DOT a partir do caminho mínimo
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