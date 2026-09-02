import dbService, { Article, CategoryRecord, UserRecord, OutageRecord, AdSlotRecord, INITIAL_DATABASE_ARTICLES } from './db';

class ApiService {
  public subscribe(listener: () => void): () => void {
    return dbService.subscribe(listener);
  }

  public async getArticles(category?: string): Promise<Article[]> {
    return await dbService.getArticles(category);
  }

  public async getArticleById(id: string): Promise<Article | undefined> {
    return await dbService.getArticleById(id);
  }

  public async createArticle(data: Partial<Article>): Promise<Article> {
    return await dbService.createArticle(data);
  }

  public async updateArticle(id: string, updates: Partial<Article>): Promise<Article | null> {
    return await dbService.updateArticle(id, updates);
  }

  public async deleteArticle(id: string): Promise<boolean> {
    return await dbService.deleteArticle(id);
  }

  public async getCategories(): Promise<CategoryRecord[]> {
    return await dbService.getCategories();
  }

  public async getUsers(): Promise<UserRecord[]> {
    return await dbService.getUsers();
  }

  public async getPowerOutages(): Promise<OutageRecord[]> {
    return await dbService.getPowerOutages();
  }

  public async getOutages(): Promise<OutageRecord[]> {
    return await dbService.getPowerOutages();
  }

  public async getAdSlots(): Promise<AdSlotRecord[]> {
    return await dbService.getAdSlots();
  }

  public async getAds(): Promise<AdSlotRecord[]> {
    return await dbService.getAdSlots();
  }
}

export const apiService = new ApiService();
export default apiService;
