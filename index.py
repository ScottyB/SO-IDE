#!/usr/bin/env python
#
# Web app that allows you to code by using snippets found on Stack Overflow
# just for fun, not intended for live code use at your own risk :)
#
# author: ScottB

import os
import urllib
from BeautifulSoup import BeautifulSoup as BS
from tornado import web, ioloop


class MainHandler(web.RequestHandler):

    def get(self):
        self.render("static/index.html")


class SOWrapper(web.RequestHandler):

    def get(self):
        url = self.get_argument("url")
        url_contents = urllib.urlopen(url)

        soup = BS(url_contents.read())
        for script in soup.findAll('script'):
            script.extract()

        result = soup.toEncoding(soup)
        self.write(result)


if __name__ == "__main__":

    SETTINGS = {
        "static_path": os.path.join(os.path.dirname(__file__), "static"),
        "debug": True}

    web.Application([(r"/", MainHandler),
                     (r"/fetch", SOWrapper)],**SETTINGS).listen(8888)


    ioloop.IOLoop.instance().start()
