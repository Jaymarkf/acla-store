export default function watchers(minWatchers, maxWatchers, update) {
    const interval = update * 1000;
    setInterval(() => {
        let baseline = (Math.floor((Math.random() * 5) + 1));
        const addOrSubtract = Math.random() < 0.5 ? -1 : 1;
        baseline *= addOrSubtract;
        const currentnumber = document.getElementById('product_watchers');
        let newWatchers = parseInt(currentnumber.innerHTML, 10) + baseline;
        if (newWatchers < minWatchers) {
            newWatchers = minWatchers;
        } else if (newWatchers > maxWatchers) {
            newWatchers = maxWatchers;
        }
        document.getElementById('product_watchers').innerHTML = newWatchers;
    }, interval);
}
