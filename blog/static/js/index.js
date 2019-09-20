var posts = (function () {
    //Cache DOM
    var domFormPost = document.querySelector('#id_form_post');
    var domFieldContent = domFormPost.querySelector('#id_content');
    var domFieldImages = domFormPost.querySelector('#id_image')
    var domPostItems = document.querySelector('#id_post_items');

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
        const domCsrfToken = domFormPost.querySelector('input[name="csrfmiddlewaretoken"]');
        const url = domFormPost.getAttribute('action');
        const csrf = domCsrfToken.value;
        const data = _buildFormData();

        httpPost(url, data, csrf).then(function (response) {
            domFormPost.reset();
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
        const domCsrfToken = el.parentNode.querySelector('input[name="csrfmiddlewaretoken"]');
        const url = el.parentNode.getAttribute('action');
        const csrf = domCsrfToken.value;

        httpDelete(url, csrf).then(function(response) { 
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

    //Bind events
    domFormPost.addEventListener('submit', addNewPost);
    domPostItems.addEventListener('click', _delegate(_iconDeleteFilter, deletePost));
    domFieldImages.addEventListener('change', previewImage);

    return {
        addNewPost: addNewPost,
        deletePost: deletePost
    };

})();

//people.addPerson("Jake");
//people.deletePerson(0);

function httpGet(url) {
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

        httpReq.open('GET', url, true);
        httpReq.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        httpReq.send();
    });
}

function httpPost(url, data, csrf) {
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

function httpDelete(url, csrf) {
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
