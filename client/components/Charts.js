import { useEffect, useState } from 'react';
import { View } from 'react-native';
import {
    VictoryAxis,
    VictoryChart,
    VictoryLine,
    VictoryScatter,
    VictoryTheme,
    VictoryZoomContainer,
} from 'victory-native';
const _ = require('lodash');

export default function Charts() {
    const [data, setData] = useState([]);
    const [zoomedXDomain, setZoomedXDomain] = useState([0, 1]);
    const [maxPoints, setMaxPoints] = useState(150);
    const [entireDomain, setEntireDomain] = useState();

    useEffect(() => {
        async function getUserData() {
            fetch('http://localhost:3001/users/1', {
                headers: {
                    Accept: 'application/json',
                    'ngrok-skip-browser-warning': 1,
                },
            })
                .then((response) => response.json())
                .then((responseData) => {
                    const data = responseData.map((item) => ({
                        x: Date.parse(item.time),
                        y: item.vehicle_speed,
                    }));
                    const domain = getEntireDomain(data);
                    setData(data);
                    setEntireDomain(domain);
                    setZoomedXDomain(domain.x);
                })
                .catch((error) => console.log(error));
        }
        getUserData();
    }, []);

    function getData() {
        const startIndex = data.findIndex((d) => d.x >= zoomedXDomain[0]);
        const endIndex = data.findIndex((d) => d.x > zoomedXDomain[1]);
        const filtered = data.slice(startIndex, endIndex);

        if (filtered.length > maxPoints) {
            // limit k to powers of 2, e.g. 64, 128, 256
            // so that the same points will be chosen reliably, reducing flicker
            const k = Math.pow(2, Math.ceil(Math.log2(filtered.length / maxPoints)));
            return filtered.filter(
                // ensure modulo is always calculated from same reference: i + startIndex
                (d, i) => (i + startIndex) % k === 0,
            );
        }
        return filtered;
    }

    function getEntireDomain(data) {
        return {
            y: [_.minBy(data, (d) => d.y).y, _.maxBy(data, (d) => d.y).y],
            x: [data[0].x, _.last(data).x],
        };
    }

    const renderedData = getData();

    return (
        <View style={{ maxHeight: 500, maxWidth: 1000, width: '100%', height: '100%' }}>
            <VictoryChart
                width={1000}
                domain={entireDomain}
                theme={VictoryTheme.material}
                scale={{ x: 'time' }}
                containerComponent={
                    <VictoryZoomContainer
                        zoomDimension="x"
                        onZoomDomainChange={(domain) => setZoomedXDomain(domain.x)}
                        minimumZoom={{ x: 1 }}
                    />
                }
            >
                <VictoryAxis />
                <VictoryAxis dependentAxis />
                <VictoryLine
                    style={{
                        data: { stroke: '#c43a31' },
                        parent: { border: '1px solid #ccc' },
                    }}
                    data={renderedData}
                />
                <VictoryScatter
                    style={{
                        data: { fill: '#c43a31' },
                        parent: { border: '1px solid #ccc' },
                    }}
                    data={renderedData}
                />
            </VictoryChart>
        </View>
    );
}
