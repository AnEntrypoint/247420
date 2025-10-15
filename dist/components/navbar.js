class SharedNavbar {
    constructor() {
        this.currentPage = this.getCurrentPage();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        return filename;
    }

    render() {
        const navbarHTML = `
            <nav class="navbar">
                <a href="index.html" ${this.currentPage === 'index.html' ? 'class="active"' : ''}>
                    <i class="fas fa-terminal"></i>
                    $ ./home.sh
                </a>
                <a href="lore.html" ${this.currentPage === 'lore.html' ? 'class="active"' : ''}>
                    <i class="fas fa-file-alt"></i>
                    $ cat lore.txt
                </a>
                <a href="images-thread.html" ${this.currentPage === 'images-thread.html' ? 'class="active"' : ''}>
                    <i class="fas fa-image"></i>
                    $ ls images/
                </a>
                <a href="videos-thread.html" ${this.currentPage === 'videos-thread.html' ? 'class="active"' : ''}>
                    <i class="fas fa-play"></i>
                    $ ./media_player --tv
                </a>
                <a href="https://420360.xyz/" target="_blank">
                    <i class="fas fa-network-wired"></i>
                    $ ssh world@247420
                </a>
            </nav>
        `;
        return navbarHTML;
    }

    inject() {
        const navbarContainer = document.querySelector('nav.navbar');
        if (navbarContainer) {
            navbarContainer.outerHTML = this.render();
        } else {
            document.body.insertAdjacentHTML('afterbegin', this.render());
        }
    }
}

window.SharedNavbar = SharedNavbar;