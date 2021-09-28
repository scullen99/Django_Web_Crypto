const CryptoChart = (() => {
    // Estas funciones facilitan algunas operaciones

    // Esta función crea elementos con distintos attributos en una sola llama, permitiendo resumir lo que serían decenas de líneas de código en unas pocas
    let  createElement = (tag, attr = false, content = false, isText = false, parent = false, prepend = false) => {
        let element = document.createElement(tag)
        if (attr) for (var k in attr) element.setAttribute(k, attr[k]);
        if (content) {
            if (typeof (content) == 'object') for (var subElement of content) element.appendChild(subElement); //contains more elements
            else element[isText ? 'innerText' : 'innerHTML'] = content;
        }
        if (parent) {
            if (prepend) parent.prepend(element);
            else parent.appendChild(element);
        }
        return element;
    };

    // Esta hace lo mismo pero con elementos SVG
    let  createElementNS = (tag, attr = false, content = false, isText = false, parent = false, prepend = false) => {
        let element = document.createElementNS('http://www.w3.org/2000/svg', tag)
        if (attr) for (var k in attr) element.setAttribute(k, attr[k]);
        if (content) {
            if (typeof (content) == 'object') for (var subElement of content) element.appendChild(subElement); //contains more elements
            else element[isText ? 'innerText' : 'innerHTML'] = content;
        }
        if (parent) {
            if (prepend) parent.prepend(element);
            else parent.appendChild(element);
        }
        return element;
    };

    // Esta función devuelve el objecto inputado en formato css
    let  cssStringfy = (object) => {
        let cssString = '';
        for (var prop in object) cssString += `${prop}: ${object[prop]};`;
        return cssString;
    }

    // Esta función devuelve la distancia entre dos números (se llama 1D cords porque la reciclé de una que calculaba la distancia entre dos vectores bidimensionales)
    let getDisntaceBtw1DCords = (x1, x2) => {
        return Math.abs(x1 - x2);
    }

    // Devuelve el número inputado en formato horario 4 => 04, 10 => 10, 0 => 00
    let zerofy = (n) => {
        return n < 10 ? `0${n}` : `${n}`;
    }

    return class {
        container; cryptosData; height; cryptos;
        constructor(container, cryptos=[], height=350) {
            // Declaramos el contenedor que contendrá la gráfica
            this.container = (typeof container == 'string') ? document.querySelector(container) : container;

            this.cryptos = cryptos;
            this.height = height;

            this.initialize();
            window.addEventListener('resize', () => this.onResize());
        }

        // Esta función inicializa la gráfica
        async initialize() {
            // Actiañozamos los datos
            await this.fetchData();

            // Creamos la base de la gráfica
            this.build();

            // Actualizamos el mostrado de gráficos seleccionando la primera criptomoneda especificada a la hora de inizializer la instancia
            this.setCrypto(Object.keys(this.cryptosData)[0]);
        }


        target_currency = 'EUR';
        // Esta función devuelve el precio de una criptomoneda dada a lo largo de los dias especificados y con la granularidad dada
        get_currency_last_days_price(currency, days=7, granularity=3600) {// 3600, 21600, 86400
            return new Promise(resolve => {
                let end_date = new Date();
                let start_date = new Date(end_date);
                start_date.setDate(start_date.getDate() - days);

                // Hacemos la petición
                fetch(`https://api.pro.coinbase.com/products/${currency}-${this.target_currency}/candles?start=${start_date.getFullYear()}-${start_date.getMonth() + 1}-${start_date.getDate()}&end=${end_date.getFullYear()}-${end_date.getMonth() + 1}-${end_date.getDate()}&granularity=${granularity}`)
                      .then(async res => resolve(await res.json()))
            });
        }

        // Esta función actualiza los datos de todas las criptomonedas
        fetchData() {
            return new Promise(async resolve => {
                this.cryptosData = {};

                for (var crypto of this.cryptos) {
                    this.cryptosData[crypto] = await this.get_currency_last_days_price(crypto);
                    this.cryptosData[crypto].forEach(c => c[0] = c[0] * 1000);
                }
                resolve();
            });
        }

        onResize() {
            // Al resizear la ventana, volvemos a actualizar el display del dato para que este adapte su tamaño al nuevo width de la ventana
            if (this.lastSelectedCrypto) this.setCrypto(this.lastSelectedCrypto);
        }


        svg; priceContainer; cryptolist;
        build() {
            // Esta función simplemente inicializa los elementos necesarios para la creación de la gráfica
            this.container.classList.add('crypto-chart');

            this.priceContainer = createElement('div', {
                'class': 'price-container'
            }, false, false, this.container);

            this.cryptolist = createElement('div', {
                'class': 'cryptos-list'
            }, false, false, this.container);

            // Creamos los botones de las criptomonedas
            for (let crypto in this.cryptosData) {
                let cryptoButton = createElement('button', {
                    'class': 'crypto-currency',
                    'data-crypto': crypto
                }, crypto, false, this.cryptolist);

                cryptoButton.addEventListener('click', () => this.setCrypto(crypto));
            }

            this.svg = createElementNS('svg', {
                'class': 'crypto-chart-display',
                'style': cssStringfy({
                    'height': `${this.height}px`
                })
            }, false, false, this.container);

            // Iniciamos los handlers de eventos de ratón sobre la gráfica (para el tooltip)
            this.svg.addEventListener('mouseenter', e => this.onMouseenter(e));
            this.svg.addEventListener('mousemove', e => this.onMousemove(e));
            this.svg.addEventListener('mouseleave', e => this.onMouseleave(e));

            this.svgD3 = d3.select(this.svg);
        }

        // Esta función devuelve el dato más cercano a una opcición x
        getNearestData(x) {
            let nearest,
                nearestDistance;

            for (var data of this.showingData) {
                let time = data[0];

                let distance = getDisntaceBtw1DCords(x, time);

                if (!nearest || distance < nearestDistance) {
                    nearest = data;
                    nearestDistance = distance;
                }
            }

            return nearest;
        }

        tooltip;
        tooltipLine;
        tooltipCircle;

        // Esta función crea el tooltip al mover el ratón
        onMouseenter(e) {

            // Obtenemos tamaño real de SVG
            let svgBRect = this.svg.getBoundingClientRect();

            // Buscamos dato más cercano a la posición del ratón (en x)
            let nearest = this.getNearestData(this.x.invert(e.x - svgBRect.left));

            // Pasamos dato a posición
            let x = this.x(nearest[0]),
                y = this.y(nearest[4]);

            let y2 = this.y.range()[0] + this.bottomAxisHeight;

            // Creamos el texto que contiene la fecha
            this.tooltip = createElementNS('text', {
                x: x + this.margin.left + 5,
                y: y2 - 5,
                class: 'price'
            }, false, true, this.svg);

            // Creamos el texto que contiene la fecha
            this.tooltip.innerHTML = this.prettifyDate(nearest[0]);

            // Creamos la línea vertical
            this.tooltipLine = createElementNS('line', {
                x1: x + this.margin.left,
                x2: x + this.margin.left,
                y1: y + this.margin.top,
                y2: y2,
                class: 'hoverline'
            }, false, false, this.svg);

            // Creamos el círculo
            this.tooltipCircle = createElementNS('circle', {
                cx: x,
                cy: y,
                r: 4,
                class: 'circle'
            }, false, false, this.svg);

            // Cambiamos el precio superior derecho
            this.setPrice(nearest[4]);
        }

        // Esta función actualiza el tooltip al mover el ratón
        onMousemove(e) {

            // Obtenemos tamaño real de SVG
            let svgBRect = this.svg.getBoundingClientRect();

            // Buscamos dato más cercano a la posición del ratón(en x)
            let nearest = this.getNearestData(this.x.invert(e.x - svgBRect.left));

            // Pasamos dato a posición
            let x = this.x(nearest[0]),
                y = this.y(nearest[4]);

            // Actualizamos display ....
            this.tooltip.setAttribute('x', x + this.margin.left + 5);

            this.tooltip.innerHTML = this.prettifyDate(nearest[0]);

            this.tooltipLine.setAttribute('x1', x + this.margin.left);
            this.tooltipLine.setAttribute('x2', x + this.margin.left);
            this.tooltipLine.setAttribute('y1', y + this.margin.top);

            this.tooltipCircle.setAttribute('cx', x + this.margin.left);
            this.tooltipCircle.setAttribute('cy', y + this.margin.top);

            // Actualizamos prevcio superior
            this.setPrice(nearest[4]);
        }

        // Elimina todos los elementos relacionados con el tooltip
        onMouseleave(e) {
            this.tooltip.remove();
            this.tooltipLine.remove();
            this.tooltipCircle.remove();

            // Actualiza el precio (al no llevar argumentos, price es false y se pone el último valor de la criptomoneda mostrada)
            this.setPrice();
        }

        // Cambia el precio del indicador superior de precio al especificado a al último de la moneda que se está mostrando
        setPrice(price=false) {
            this.priceContainer.innerHTML = `${price != false ? price : this.showingData[0][4]}€`;
        }

        margin = {
            'left': 0,
            'top': 10,
            'right': 0,
            'bottom': 20
        }

        bottomAxisHeight = 20;

        // Esta función devuelve la fecha inputada en el formato que deseamos mostrar
        prettifyDate(date) {
            date = new Date(date);

            return `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} ${zerofy(date.getHours())}:${zerofy(date.getMinutes())}`;
        }

        lastSelectedCrypto;
        // Esta función renderiza la gráfica de la criptomoneda inputada
        setCrypto(crypto) {
            // Guardar esto será util a la hora de handlear los resizes
            this.lastSelectedCrypto = crypto;

            // Eliminamos clase de resaltado a los botones que la tengan
            this.cryptolist.querySelectorAll('button.selected')
                .forEach(btn => btn.classList.remove('selected'));

            // Obtenemos el botón de la criptomoneda a mostrar
            let cryptoButton = this.cryptolist.querySelector(`button[data-crypto="${crypto}"]`);

            // Añadomos clase al bótón de la criptomoneda a mostrar para resaltarlo
            cryptoButton.classList.add('selected');

            // Eliminamops posibles elementos previos vaciando el padre
            this.svg.innerHTML = '';

            // Actualizamos la variable que contiene los datos que se están mostrando
            this.showingData = this.cryptosData[crypto];

            // creamos el contenedor del path que contendrá la gráfica
            let g = this.svgD3.append('g')
                .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

            // Definimos las escalas de D3JS con sus respectivos rangos y dominios
            this.x = d3.scaleTime().rangeRound([0, this.svg.clientWidth - this.margin.left - this.margin.right]),
            this.y = d3.scaleLinear().rangeRound([this.height - this.margin.top - this.margin.bottom - this.bottomAxisHeight, 0]);

            this.x.domain( d3.extent( this.showingData, d => new Date(d[0]) ) );
            this.y.domain( d3.extent( this.showingData, d => d[4] ) );

            // Definimos y mostramos los ticks inferiores con las dias que se están visualizando
            let ticks = g.append("g")
                .attr("transform", `translate(0, ${this.height - this.margin.bottom - this.bottomAxisHeight})`)
                .call(d3.axisBottom(this.x)
                    .ticks(7)
                    .tickFormat(t => `${t.getDate()}/${t.getMonth()}/${t.getFullYear()}`));

            // Eliminamos y actualizamos algunos elementos por pura estética
            ticks.select(".domain")
                .remove();

            ticks.selectAll("line")
                .each(function() {
                    this.setAttribute('y2', parseFloat(this.getAttribute('y2')) + 18)
                });

            ticks.selectAll("text")
                .each(function() {
                    this.setAttribute('x', 5)
                });

            ticks.append('line')
                .attr("x2", '100%');

            // Definimos la línea que contendrá la prograsión del precio
            let line = d3.line()
                .x(d => this.x(new Date(d[0])))
                .y(d => this.y(d[4]));

            // Appendeamos el path con la línea
            g.append('path')
                .datum(this.showingData)
                .transition()
                .attr('d', line);

            // Esta llamada actualizara el contador de precio al último registro disponible de la criptomoneda seleccionada
            this.setPrice();
        }
    }
})();