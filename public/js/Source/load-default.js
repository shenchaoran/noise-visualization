
let LoadDefault = {
    load: (fname) => {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: `/default-data/${fname}`,
                method: 'GET',
                dataType: 'json'
            })
                .success(json => {
                    return resolve(json);
                })
                .error(e => {
                    return reject(e);
                });
        });
    },

    addGeojson: (json) => {

    },

    loadDefault: () => {
        let files = ['1st green.json', '1st road.json', '1st water.json', '2th green.json', '4th water.json', '5 meter noise.json', '10 meter noise.json', '20 meter noise.json', 'block.json', 'bridge.json', 'building.json', 'road center.json'];
        Promise.map(
            files,
            file => {
                return load(file)
                    .then(json => {

                    })
                    .catch(e => {
                        return Promise.resolve();
                    });
            },
            {
                concurrency: 5
            }
        )
            .then(rsts => {

            });
    }
}