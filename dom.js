function elem(id) {
    return document.getElementById(id);
}

function btn(id, cb) {
    let el = elem(id);
    if (!el) return;
    el.onclick = cb;
}

function val(id, v) {
    let el = elem(id);
    if (!el) return;
    if (el.type == "checkbox") {
        if (v == undefined)
            return el.checked;
        else
            el.checked = v;
    } else {
        if (v == undefined)
            return el.value;
        else
            el.value = v;
    }
}

function txt(id, t) {
    let el = elem(id);
    if (!el) return;
    el.innerText = t;
}

function html(id, h) {
    let el = elem(id);
    if (!el) return;
    el.innerHTML = h;
}
