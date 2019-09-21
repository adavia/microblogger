var paginator = (function() {
    var page = 1;
    var emptyPage = false;
    var blockRequest = false;

    function loadMore() {
        var self = this;

        if (this.scrollTop + this.clientHeight >= this.scrollHeight && emptyPage == false && 
            blockRequest == false) {
            blockRequest = true;
            page = page + 1;
            httpGet('?page=' + page).then(function(response) { 
                if (response == '') {
                    emptyPage = true;
                } else {
                    blockRequest = false;
                    self.insertAdjacentHTML('beforeend', response);
                }
            }).catch(function(e) {
                console.log(e)
            });
        }
    }

    return {
        loadMore: loadMore
    }
})();

var posts = (function () {
    //Cache DOM
    var domFormPost = document.querySelector('#id_form_post');
    var domFieldContent = domFormPost.querySelector('#id_content');
    var domFieldImages = domFormPost.querySelector('#id_image');
    var domPostItems = document.querySelector('#id_post_items');
    var domMainContent = document.querySelector('#id_main_content');

    var _delegate = function(criteria, listener) {
        return function (e) {
            var el = e.target;
            do {
                if (!criteria(el)) continue;
                e.delegateTarget = el;
                listener.apply(this, arguments);
                return;
            } while ((el = el.parentNode));
        };
    }

    var _iconDeleteFilter = function(elem) { 
        return elem.classList && elem.classList.contains('post-delete'); 
    }

    var _likePostFilter = function(elem) { 
        return elem.classList && elem.classList.contains('post-like'); 
    }

    function _render(data) {
        domPostItems.insertAdjacentHTML('afterbegin', data);
    }

    function _clearForm(field) {
        fieldMsg = field.nextElementSibling;

        if (fieldMsg) {
            fieldMsg.parentNode.removeChild(fieldMsg);
        }

        field.classList.remove('border-red-500');
    }

    function _displayErrors(errors) {
        const keys = Object.keys(errors);

        for (const key of keys) {
            field = domFormPost.querySelector(`#id_${key}`);

            _clearForm(field);

            field.classList.add('border-red-500');
            field.insertAdjacentHTML('afterend', `
                <p id="id_${key}_error" class="text-red-500 text-xs mt-2">
                    ${errors[key][0]}
                </p>
            `);
        }
    }

    function _buildFormData() {
        const images = domFieldImages.files;
        var formData = new FormData();

        formData.append('content', domFieldContent.value);

        for (let i = 0; i < images.length; i++) {
            let img = images[i];

            formData.append('image', img);
        }

        return formData;
    }

    function addNewPost(event) {
        event.preventDefault();
        const url = this.getAttribute('action');
        const data = _buildFormData();

        httpPost(url, data).then((response) => {
            this.reset();
            domPreviewImages.innerHTML = '';
            _clearForm(domFieldContent);
            _render(response);
        }).catch(function (e) {
            _displayErrors(e.errors);
        });
    }

    function deletePost(event) {
        event.preventDefault();
        const el = event.delegateTarget;
        const post = el.closest('article');
        const url = el.parentNode.getAttribute('action');

        httpDelete(url).then(function(response) { 
            domPostItems.removeChild(post);
        }).catch(function(e) {
            console.log(e)
        });
    }
    
    function previewImage(event) {
        domPreviewImages = domFormPost.querySelector('#id_preview_img');
        
        if (this.files) {
            var filesize = this.files.length;

            for (i = 0; i < filesize; i++) {
                var reader = new FileReader();
                reader.onload = function(event) {
                    domPreviewImages.insertAdjacentHTML('beforeend', `
                        <div class="bg-cover bg-center rounded-lg h-24 w-24 mx-2 mb-4" 
                            style="background-image: url('${event.target.result}')">
                            <span class="rounded-full cursor-pointer h-8 w-8 float-right flex items-center 
                                justify-center bg-gray-800 text-white m-2">x</span>
                        </div>
                    `);
                }
                reader.readAsDataURL(this.files[i]);
            }
        }
    }

    function likePost(event) {
        event.preventDefault();
        const el = event.delegateTarget;
        const url = el.getAttribute('href');

        const formData = new FormData;
        formData.append('id', el.dataset.id);
        formData.append('action', el.dataset.action);

        httpPost(url, formData).then(function(response) {
            let data = JSON.parse(response);

            if (data['status'] === 'ok') {
                const previous_action = el.dataset.action;

                // toggle data-action
                el.dataset.action = previous_action == 'like' ? 
                'unlike' : 'like';
                // toggle link text
                el.innerHTML = previous_action == 'like' ? `
                    <svg xmlns="http://www.w3.org/2000/svg" 
                        class="fill-current cursor-pointer text-indigo-500
                        hover:text-indigo-700 h-6 w-6" viewBox="0 0 24 24">
                        <path d="M12 9.229c.234-1.12 1.547-6.229 5.382-6.229 2.22 0 4.618 1.551 4.618 5.003 0 3.907-3.627 8.47-10 12.629-6.373-4.159-10-8.722-10-12.629 0-3.484 2.369-5.005 4.577-5.005 3.923 0 5.145 5.126 5.423 6.231zm-12-1.226c0 4.068 3.06 9.481 12 14.997 8.94-5.516 12-10.929 12-14.997 0-7.962-9.648-9.028-12-3.737-2.338-5.262-12-4.27-12 3.737z"/>
                    </svg>` : 
                    `<svg xmlns="http://www.w3.org/2000/svg" 
                        class="fill-current cursor-pointer text-indigo-500
                        hover:text-indigo-700 h-6 w-6" viewBox="0 0 24 24">
                        <path d="M12 4.248c-3.148-5.402-12-3.825-12 2.944 0 4.661 5.571 9.427 12 15.808 6.43-6.381 12-11.147 12-15.808 0-6.792-8.875-8.306-12-2.944z"/>
                    </svg>`;
            }
        }).catch(function (e) {
            console.log(e);
        });
    }

    //Bind events
    domFormPost.addEventListener('submit', addNewPost);
    domPostItems.addEventListener('click', _delegate(_iconDeleteFilter, deletePost));
    domFieldImages.addEventListener('change', previewImage);
    domPostItems.addEventListener('click', _delegate(_likePostFilter, likePost));
    domMainContent.addEventListener('scroll', paginator.loadMore);
    
    return {
        addNewPost: addNewPost,
        deletePost: deletePost
    };

})();

function httpGet(url) {
    return new Promise(function (resolve, reject) {
        var httpReq = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');

        httpReq.onreadystatechange = function () {
            var data;

            if (httpReq.readyState == 4) {
                if (httpReq.status == 200) {
                    data = httpReq.responseText;
                    resolve(data);
                } else {
                    reject(new Error(httpReq.statusText));
                }
            }
        }

        httpReq.open('GET', url, true);
        httpReq.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        httpReq.send();
    });
}

function httpPost(url, data, csrf=Cookies.get('csrftoken')) {
    return new Promise(function (resolve, reject) {
        var httpReq = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");

        httpReq.onreadystatechange = function () {
            var data;

            if (httpReq.readyState == 4) {
                if (httpReq.status == 200) {
                    data = httpReq.responseText;
                    resolve(data);
                } else {
                    reject(JSON.parse(httpReq.responseText));
                }
            }
        }

        httpReq.open('POST', url, true);
        httpReq.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        httpReq.setRequestHeader('X-CSRFToken', csrf);
        httpReq.send(data);
    });
}

function httpDelete(url, csrf=Cookies.get('csrftoken')) {
    return new Promise(function (resolve, reject) {
        var httpReq = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');

        httpReq.onreadystatechange = function () {
            var data;

            if (httpReq.readyState == 4) {
                if (httpReq.status == 200) {
                    data = JSON.parse(httpReq.responseText);
                    resolve(data);
                } else {
                    reject(new Error(httpReq.statusText));
                }
            }
        }

        httpReq.open('DELETE', url, true);
        httpReq.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        httpReq.setRequestHeader('X-CSRFToken', csrf);
        httpReq.send();
    });
} 
