import YahooFinance from "yahoo-finance2";
import logger from "../utils/logger.js";

const yahooFinance = new YahooFinance();

export const getStockPrice = async (symbol) => {
  if (!symbol) throw new Error("Symbol is required");

  const cleanSymbol = symbol.trim().toUpperCase();

  try {
    const quote = await yahooFinance.quote(cleanSymbol);

    if (!quote) {
      throw new Error(`No data found for symbol: ${cleanSymbol}`);
    }

    const price =
      quote.regularMarketPrice ||
      quote.postMarketPrice ||
      quote.preMarketPrice ||
      quote.navPrice ||
      quote.bid ||
      quote.ask;

    if (price === undefined || price === null) {
      throw new Error(`Price not available for symbol: ${cleanSymbol}`);
    }

    return {
      price: price,
      currency: quote.currency || "USD",
      name:
        quote.longName || quote.shortName || quote.displayName || cleanSymbol,
    };
  } catch (error) {
    logger.error(`Error fetching price for ${cleanSymbol}:`, error.message);
    throw new Error(
      `Failed to fetch price for ${cleanSymbol}: ${error.message}`,
    );
  }
};

export const getMultiplePrices = async (symbols) => {
  try {
    const results = {};

    for (const symbol of symbols) {
      try {
        const data = await getStockPrice(symbol);
        results[symbol] = {
          success: true,
          ...data,
        };
      } catch (error) {
        results[symbol] = {
          success: false,
          error: error.message,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return results;
  } catch (error) {
    logger.error("Error fetching multiple prices:", error.message);
    throw error;
  }
};

export const searchSymbols = async (query) => {
  if (!query) return [];

  try {
    const results = await yahooFinance.search(query);
    if (!results || !results.quotes) return [];

    return results.quotes.map((quote) => ({
      symbol: quote.symbol,
      name: quote.longname || quote.shortname || quote.symbol,
      type: quote.quoteType,
      exchange: quote.exchange,
    }));
  } catch (error) {
    logger.error("Error searching symbols:", error.message);
    throw error;
  }
};
