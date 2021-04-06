---
layout: layout.njk
tags: post
title: async transparency in practice
date: 2021-04-06
---

## What is Async-Transparency?

The most interesting aspect of hyperscript, technically, is that it is [async transparent](/docs#async). This means
that asynchronous and synchronous code can be mixed together freely, and the hyperscript runtime, rather than you, the
developer, figures everything out.

This can all be a little abstract, and so I wanted to take an example of some asynchronous code and show you what
the equivalent hyperscript would be.

To motivate the discussion, we are going to look at the code from [How To Master Async/Await With This Real World Example](https://medium.com/free-code-camp/how-to-master-async-await-with-this-real-world-example-19107e7558ad), an excellent pratical introduction to the `async` and `await` keywords built into
javascript.

The author uses a few web APIs to design a small currency converter application in javascript, using 
[axios](https://github.com/axios/axios) and the `async` and `await` keywords.  

The author creates three asynchronous functions:
  * one to get exchange rates
  * one to get all countries that use a given currency
  * one to call both those functions and create a user-facing message 

```javascript

const getExchangeRate = async (fromCurrency, toCurrency) => {
  try {
    const response = await axios.get('http://data.fixer.io/api/latest?access_key=f68b13604ac8e570a00f7d8fe7f25e1b&format=1');    const rate = response.data.rates;
    const euro = 1 / rate[fromCurrency];
    const exchangeRate = euro * rate[toCurrency];    return exchangeRate;
  } catch (error) {
    throw new Error(`Unable to get currency ${fromCurrency} and  ${toCurrency}`);
  }
};

const getCountries = async (currencyCode) => {
  try {
    const response = await axios.get(`https://restcountries.eu/rest/v2/currency/${currencyCode}`);return response.data.map(country => country.name);
  } catch (error) {
    throw new Error(`Unable to get countries that use ${currencyCode}`);
  }
};

const convert = async (fromCurrency, toCurrency, amount) => {
  const exchangeRate = await getExchangeRate(fromCurrency, toCurrency);
  const countries = await getCountries(toCurrency);
  const convertedAmount = (amount * exchangeRate).toFixed(2);
  return `${amount} ${fromCurrency} is worth ${convertedAmount} ${toCurrency}. You can spend these in the following countries: ${countries}`;
}

```

The author then uses the `convert` function like so:

```javascript
convert('USD', 'HRK', 20)
  .then((message) => {
    console.log(message);
  }).catch((error) => {
    console.log(error.message);
  });
```

This uses the callback API of Promises.

All in all, a great little example of how to do asynchronous programming in javascript.

## Converting To Hyperscript

So, what does this code look like in hyperscript?  Let's port it over!  We'll start with `getExchangeRate`

```hyperscript
def getExchangeRate(fromCurrency, toCurrency)
    fetch http://data.fixer.io/api/latest?access_key=f68b13604ac8e570a00f7d8fe7f25e1b&format=1 as json
    set rates to the rates of the result's data
    set euro to 1 / rates[fromCurrency]
    get euro * rates[toCurrency]
    return it
  catch error
    throw `Unable to get currency ${fromCurrency} and  ${toCurrency}`
```

So, the first things we do is switch from axios to the [`fetch` command](/commands/fetch) which will pull down the 
given data for us.  Note that we do not need to say `await`, rather the hyperscript runtime takes care of that for us.
Note also that we have an `as json` at the end, to indicate that we want the result parsed as JSON.

The next line is a little clever, we set a variable, `rates` to the `result.data.rates` value, but we use hyperscripts
`of` expression, as well as its `possessive` expression to make the line read more cleanly.  

The next line we set a variable to the inverse of the euro rate for the given currency.

The next line we `get` the rate multiplied by the euro rate for the target currency.

Finally, we return that value we just calculated.  (I like returning a simple symbol like this for debugging, we could
have returned the previous line)

In hyperscript, a function can have one and only one exception block (this is experimental, and may change) and it will
work regardless if the body of the function is synchronous or asynchronous.

OK, so the code looks similar in some ways to the javascript above, but obviously hyperscript has its own flavor.

`getCountries` is very similar, except we use a string template as our argument to the `fetch` command:

```hyperscript
def getCountries(currencyCode)
    fetch `https://restcountries.eu/rest/v2/currency/${currencyCode}` as json
    return result.map(\ country -> country.name)
  catch (error)
    throw `Unable to get countries that use ${currencyCode}`
```

`convert` is just a bit of glue code to produce a string template and is pretty similar to the javascript, except 
that there are no `awaits`

```hyperscript
def convert(fromCurrency, toCurrency, amount) 
    set rate to exchangeRate(fromCurrency, toCurrency)
    set countries to countries(toCurrency)
    get (amount * rate).toFixed(2)
    return `${amount} ${fromCurrency} is worth ${result} ${toCurrency} in the following countries: ${countries}`
```

## The Punchline

So, the hyperscript is maybe a little cleaner, but we haven't really seen the punchline yet, which is the usage of 
this functionality.

Recall that in the javascript version, you would write code like this to use it:

```html
<button onclick="convert('USD', 'EUR', 10)
                   .then((message) => {
                     document.getElementById('output').innerText = message;
                   })">
  Convert $10 To Euros
</button>
<p id="output"></p>
```

Here is the equivalent hyperscript:

```html
<button _="put convert('USD', 'EUR', 10) into #output">
  Convert $10 To Euros
</button>
<p id="output"></p>
```

Because the hyperscript runtime both resolves *and creates* any promises needed by the functions and event handler under
the covers, you are able to write both the methods as well as the use of the methods in the straight forward, linear fashion
you are used to.

No more (explicit) promises!

## Conclusion

I hope that this example gives you a sense of what the async-transparent runtime of hyperscript can do.  Hyperscript
is designed to simplify front end scripting, increasing the expressiveness to the point that many common patterns
can be written inline in HTML, and refocus front end scripting on event handling.

If this sort of thing is interesting to you, you might want to read up on 
[event driven control flow](/docs#event-control-flow), a novel control flow mechanism enabled by hyperscript's runtime.

Cheers!
