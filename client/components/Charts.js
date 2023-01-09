import { useEffect, useState } from 'react';
import { View } from 'react-native';
import {
    VictoryAxis,
    VictoryChart,
    VictoryLabel,
    VictoryLine,
    VictoryScatter,
    VictoryTheme,
    VictoryZoomContainer,
    VictoryVoronoiContainer,
    createContainer,
} from 'victory-native';
const _ = require('lodash');
import responsePIDs from '../constants/PID-database';

const VictoryZoomVoronoiContainer = createContainer('zoom', 'voronoi');

export default function Charts({ pidName, url }) {
    const [data, setData] = useState();
    const [zoomedXDomain, setZoomedXDomain] = useState([0, 1]);
    const [maxPoints, setMaxPoints] = useState(200);
    const [entireDomain, setEntireDomain] = useState();
    const [PID, setPID] = useState();

    useEffect(() => {
        async function getUserData() {
            fetch(`${url}user/data/${pidName}`, {
                headers: {
                    Accept: 'application/json',
                    'ngrok-skip-browser-warning': 1,
                },
            })
                .then((response) => response.json())
                .then((responseData) => {
                    const data = responseData.map((item) => ({
                        x: item.timestamp,
                        y: item[pidName],
                    }));
                    setData(data);
                    const domain = getEntireDomain(data);
                    setEntireDomain(domain);
                    setZoomedXDomain(domain.x);
                    const pid = responsePIDs.find((obj) => obj.name === pidName);
                    setPID(pid);
                })
                .catch((error) => console.log(error));
        }
        getUserData();
    }, [pidName]);

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

    const renderedData = data && getData();

    return (
        <View style={{ height: 500, width: 1000 }}>
            {data && (
                <VictoryChart
                    width={1000}
                    padding={{ left: 60 }}
                    domain={entireDomain}
                    domainPadding={{ y: [0, 10] }}
                    theme={VictoryTheme.material}
                    scale={{ x: 'time' }}
                    containerComponent={
                        <VictoryZoomVoronoiContainer
                            zoomDimension="x"
                            onZoomDomainChange={(domain) => setZoomedXDomain(domain.x)}
                            minimumZoom={{ x: 1 }}
                            labels={({ datum }) =>
                                `${new Date(datum.x).toLocaleTimeString()}, ${datum.y} ${PID.unit}`
                            }
                            voronoiBlacklist={['scatter']}
                        />
                    }
                >
                    <VictoryAxis axisLabelComponent={<VictoryLabel dy={20} />} label={'Time'} />
                    <VictoryAxis
                        dependentAxis
                        axisLabelComponent={<VictoryLabel dy={-30} />}
                        label={`${PID?.description} (${PID?.unit})`}
                    />
                    <VictoryLine
                        name="line"
                        style={{
                            data: { stroke: '#c43a31' },
                            parent: { border: '1px solid #ccc' },
                        }}
                        data={renderedData}
                    />
                    <VictoryScatter
                        name="scatter"
                        style={{
                            data: { fill: '#c43a31' },
                            parent: { border: '1px solid #ccc' },
                        }}
                        data={renderedData}
                    />
                </VictoryChart>
            )}
        </View>
    );
}
