const BASE_URL = 'https://api.harvardartmuseums.org';
const KEY = 'apikey=4bdbc531-de80-46bc-a963-8a6a0a3fb6ac'; // USE YOUR KEY HERE



async function fetchObjects() {
    onFetchStart()
    const url = `${ BASE_URL }/object?${ KEY }`;
  
    try {
      const response = await fetch(url);
      const data = await response.json();
  
      return data;
    } catch (error) {
      console.error(error);
    }finally {
        onFetchEnd()
    }
}

async function fetchAllCenturies() {
    onFetchStart()
    const url = `${ BASE_URL }/century?${ KEY }&size=100&sort=temporalorder`;
    if (localStorage.getItem('centuries')) {
        return JSON.parse(localStorage.getItem('centuries'));
    }
    try {
      const response = await fetch(url);
      const data = await response.json();
      const records = data.records;
  
      return records;
    } catch (error) {
      console.error(error);
    }finally {
        onFetchEnd();
    }
}

async function fetchAllClassifications() {
    onFetchStart();
    const url = `${ BASE_URL }/classification?${ KEY }&size=100&sort=name`;
    if (localStorage.getItem('classifications')) {
        return JSON.parse(localStorage.getItem('classifications'));
    }
    try {
      const response = await fetch(url);
      const data = await response.json();
      const records = data.records;
  
      return records;
    } catch (error) {
      console.error(error);
    }finally {
        onFetchEnd()
    }
}

async function prefetchCategoryLists() {
    try {
      const [
        classifications, centuries
      ] = await Promise.all([
        fetchAllClassifications(),
        fetchAllCenturies()
      ]);
        // This provides a clue to the user, that there are items in the dropdown
        $('.classification-count').text(`(${ classifications.length })`);

        classifications.forEach(classification => {
            let tag = $('<option id = "select-classification" value="' + classification.name + '">' + classification.name + '</option>')
            $('select#select-classification').append(tag)
        });

        // This provides a clue to the user, that there are items in the dropdown
        $('.century-count').text(`(${ centuries.length }))`);

        centuries.forEach(century => {
            let tag = $('<option id = "select-century" value="' + century.name + '">' + century.name + '</option>')
            $('select#select-century').append(tag)
        });
    } catch (error) {
      console.error(error);
    }
}

function buildSearchString() {
    let url = `${BASE_URL}/object?${KEY}&classification=`
    let classification = $('#select-classification').val()
    let century = $('#select-century').val()
    let keywords = $('#keywords').val()
    url = url + classification + "&century=" + century + "&keyword=" +  keywords
    const encodedUrl = encodeURI(url); 
    return encodedUrl;
}

function renderPreview(record) {
    const {
        primaryimageurl,
        title,
        description
    } = record

    let recordItem = $(`<div class="object-preview">`)
    let anchor = $(`<a href="#">`)
    if(primaryimageurl != null) {
        let image = $(`<img src="${primaryimageurl}"/>`)
        anchor.append(image)
    }
    if(title != null) {
        let titles = $(`<h3>${title}</h3>`)
        anchor.append(titles)
    }
    if(description != null)  { 
        let desc = $(`<h3>${description}</h3>`)
        anchor.append(desc)
    }
    recordItem.append(anchor)
    recordItem.data('record', record)
    return recordItem;
}
  
  
function updatePreview(data) {
    const root = $('#preview .results');
    const {
        info,
        records
    } = data
  
    if(info.next) {
        $('.next').data("url", info.next)
        $('.next').attr('disabled', false)
    }else {
        $('.next').data('url', null)
        $('.next').attr('disabled', true)
    }

    if(info.prev) {
        $('.previous').data('url', info.prev)
        $('.previous').attr('disabled', false)
    }else {
        $('.previous').data('url', null)
        $('.previous').attr('disabled', true)
    }

    if(root != undefined) {
        root.empty();
    }

    records.forEach(function(res){
        root.append(renderPreview(res))
    })
}

function onFetchStart() {
    $('#loading').addClass('active');
}

function onFetchEnd() {
    $('#loading').removeClass('active');
}

function renderFeature(record) {
    const {
        title,
        dated,
        description,
        culture,
        style,
        technique,
        medium,
        dimensions,
        people,
        department,
        division,
        contact,
        creditline,
        images,
        primaryimageurl
    } = record


    return $(`<div class="object-feature">
        <header> 
            <h3>${title}</h3>
            <h4>${dated ? dated : ''}</h4>
        </header>
        <section class="facts">
            ${factHTML('Description', description)}
            ${factHTML('Culture', culture, 'culture')}
            ${factHTML('Style', style)}
            ${factHTML('Technique', technique, 'technique')}
            ${factHTML('Medium', medium, 'medium')}
            ${factHTML('Dimensions', dimensions)}
            ${people ? people.map(function(person) {
                    return factHTML('Person', person.displayname, 'person');
                }).join('') 
                : ''
              }
            ${factHTML('Department', department)}
            ${factHTML('Division', division)}
            ${factHTML('Contact', `<a target="_blank" href="mailto:${contact}">${contact}</a>`)}
            ${factHTML('Credit', creditline)}
        </section>
        <section class="photos">
            ${photosHTML(images,  primaryimageurl)}
        </section>
    </div>`);
  }

function searchURL(searchType, searchString) {
    return `${BASE_URL}/object?${KEY}&${searchType}=${searchString}`;
}

function factHTML(title, content, search) {
    if(content == null) {
        return ''
    } else if(search == null) {
        return `<span class="title">${title}</span>
        <span class="content">${content}</span>`
    } else {
        return `<span class="title">${title}</span>
        <span class="content"><a href=${searchURL(search, content)}  class='link'>${content}</a></span>`
    }
}

function photosHTML(images, primaryimageurl) {
    // if images is defined AND images.length > 0, map the images to the correct image tags, then join them into a single string.  the images have a property called baseimageurl, use that as the value for src
    if(images && images.length>0) {
        return `${images.map(function(image) {
                return `<img src=${image.baseimageurl}/>`
        }).join('')}`
    }else if(primaryimageurl) {
        return `<img src=${primaryimageurl}/>`
    }else {
        return ""
    }
  }

$('#search').on('submit', async function (event) {
    event.preventDefault();
    onFetchStart()
    try {
        const response = await fetch(buildSearchString());
        const data = await response.json();
        updatePreview(data)
    } catch (error) {
        console.log(error)
    } finally {
        onFetchEnd()
    }
});

$('#preview .next, #preview .previous').on('click', async function () {
    onFetchStart()
    try {
        const response = await fetch($(this).data('url'))
        const data = await response.json();
        updatePreview(data)
    } catch(error) {
        console.log(error)
    } finally {
        onFetchEnd()
    }
});

$('#preview').on('click', '.object-preview', function (event) {
    event.preventDefault(); // they're anchor tags, so don't follow the link
    $('#feature').html(renderFeature($(this).closest('.object-preview').data('record')))
});

$('#feature').on('click', '.link', async function (event) {
    if ($(this).attr('href').startsWith('mailto')) { return; }
    event.preventDefault(); // they're anchor tags, so don't follow the link
    onFetchStart()
    try {
        const response = await fetch($(this).attr('href'));
        const data = await response.json();
        updatePreview(data)
    } catch (error) {
        console.log(error)
    } finally {
        onFetchEnd()
    }
});

fetchObjects(); 
prefetchCategoryLists()